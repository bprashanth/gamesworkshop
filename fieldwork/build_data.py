"""Rebuild the small, offline game dataset from the bundled primary-source XLS.

Runtime needs only the generated JSON. Rebuilding needs xlrd==2.0.2:
    uv run --with xlrd==2.0.2 python fieldwork/build_data.py

No values are filled, estimated, geocoded, or produced by a language model.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re

DATA = Path(__file__).with_name("data")
SOURCE = DATA / "NFHS_5_India_Districts_Factsheet_Data.xls"
EXPECTED_SHA256 = "e482b990d74eb46b5ce5a6e10606b745a914d4b1b57838c1c6149e80ec8ad498"
SOURCE_URL = "https://data.gov.in/files/ogdpv2dms/s3fs-public/datafile/NFHS_5_India_Districts_Factsheet_Data.xls"
RESOURCE_URL = "https://www.data.gov.in/resource/india-districts-factsheets-national-family-health-survey-nfhs-5-2019-2021-provisional"
SAIHA_PDF = DATA / "NFHS-5_DistFact_Mizoram_Saiha.pdf"
SAIHA_SHA256 = "822e94234bc655b0a9898089fdf933cde294e5722af4c0adb92900f6c873e07c"
SAIHA_URL = "https://www.nfhsiips.in/assets/publication/NFHS-5/DistFact/Mizoram/Saiha/NFHS-5_DistFact_Mizoram_Saiha__Saiha.pdf"

# Zero-indexed columns in the original official workbook. Header checks below
# fail if a newer source changes the schema instead of silently moving columns.
SELECTED = {
    "birth_registration": (9, "Children under age 5 years whose birth was registered", "Children under 5 with registered births", "coverage"),
    "electricity": (11, "Population living in households with electricity", "Population in households with electricity", "coverage"),
    "improved_water": (12, "Population living in households with an improved drinking-water", "Population with an improved drinking-water source", "coverage"),
    "sanitation": (13, "Population living in households that use an improved sanitation", "Population using improved sanitation", "coverage"),
    "clean_fuel": (14, "Households using clean fuel for cooking", "Households using clean cooking fuel", "coverage"),
    "health_insurance": (16, "Households with any usual member covered under a health insurance", "Households with a member covered by health insurance or financing", "coverage"),
    "women_literacy": (18, "Women (age 15-49) who are literate", "Women aged 15–49 who are literate", "coverage"),
    "women_schooling": (19, "Women (age 15-49)  with 10 or more years of schooling", "Women aged 15–49 with at least 10 years of schooling", "coverage"),
    "antenatal_visits": (37, "Mothers who had at least 4 antenatal care visits", "Mothers with at least four antenatal visits", "coverage"),
    "vaccination": (53, "Children age 12-23 months fully vaccinated based on information from either", "Children aged 12–23 months fully vaccinated", "coverage"),
    "child_stunting": (77, "Children under 5 years who are stunted", "Children under 5 who are stunted", "burden"),
    "women_anaemia": (88, "All women age 15-49 years who are anaemic", "Women aged 15–49 who are anaemic", "burden"),
}


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def build() -> dict:
    import xlrd  # Build-time dependency only.

    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError("Source checksum changed; review the new release before rebuilding")
    workbook = xlrd.open_workbook(str(SOURCE), formatting_info=True)
    sheet = workbook.sheet_by_index(0)
    assert sheet.nrows == 708 and sheet.ncols == 109
    indicators = {}
    for key, (column, prefix, label, direction) in SELECTED.items():
        header = sheet.cell_value(0, column).strip()
        if not header.startswith(prefix):
            raise ValueError(f"Unexpected source header for {key}: {header!r}")
        indicators[key] = {"label": label, "source_label": header, "unit": "percent", "direction": direction, "source_column": column + 1}
    districts = []
    for row in range(1, sheet.nrows):
        name, source_state = (sheet.cell_value(row, col).strip() for col in (0, 1))
        # A spelling correction only; retain original attribution in source_state.
        state = "Maharashtra" if source_state == "Maharastra" else source_state
        record = {
            "id": slug(state + "-" + name), "name": name, "state": state,
            "source_state": source_state, "geography_level": "district",
            "source_row": row + 1, "indicators": {}, "flags": {},
        }
        for key, (column, *_rest) in SELECTED.items():
            cell = sheet.cell(row, column)
            value = cell.value
            flag = None
            if isinstance(value, str) and value.strip() in {"*", "", "na", "NA"}:
                value = None
                flag = "Suppressed: fewer than 25 unweighted cases" if cell.value == "*" else "Not available"
            elif isinstance(value, (float, int)):
                if value < 0:
                    # The source uses negative Excel numbers displayed as
                    # parentheses to mark small samples. Verify the number
                    # format before interpreting this otherwise invalid rate.
                    fmt = workbook.format_map[workbook.xf_list[cell.xf_index].format_key].format_str
                    if fmt != "0.0_);\\(0.0\\)":
                        raise ValueError(f"Unexplained negative value at row {row + 1}, {key}")
                    value = abs(value)
                    flag = "Based on 25–49 unweighted cases"
                if not 0 <= value <= 100:
                    raise ValueError(f"Out-of-range percentage at row {row + 1}, {key}")
                value = float(value)
            else:
                raise ValueError(f"Unknown cell value at row {row + 1}, {key}: {value!r}")
            record["indicators"][key] = value
            if flag:
                record["flags"][key] = flag
        districts.append(record)
    # Primary OGD row 407 copies Manipur's Chandel into Mizoram and omits
    # Saiha. Never rename the copied indicators: replace the entire record
    # with independently read values from IIPS's original Saiha factsheet.
    if hashlib.sha256(SAIHA_PDF.read_bytes()).hexdigest() != SAIHA_SHA256:
        raise ValueError("Saiha primary factsheet checksum changed")
    bad = next(item for item in districts if item["id"] == "mizoram-chandel")
    original = next(item for item in districts if item["id"] == "manipur-chandel")
    assert bad["source_row"] == 407 and bad["indicators"] == original["indicators"]
    districts.remove(bad)
    districts.append({
        "id": "mizoram-saiha", "name": "Saiha", "state": "Mizoram",
        "source_state": "Mizoram", "geography_level": "district",
        "source_row": None, "source_url": SAIHA_URL,
        "source_override": {
            "reason": "Official OGD workbook row 407 duplicates Manipur's Chandel under Mizoram; Saiha is absent. Replaced from original IIPS Saiha factsheet, not by renaming the copied row.",
            "replaced_source_row": 407, "source_sha256": SAIHA_SHA256,
            "survey_period": "2019–2020", "pdf_pages": [3, 4, 5],
            "source_precision": "One decimal place as published in the PDF",
        },
        "indicators": {
            "birth_registration": 97.5, "electricity": 99.7, "improved_water": 95.2,
            "sanitation": 91.5, "clean_fuel": 83.7, "health_insurance": 44.2,
            "women_literacy": 95.1, "women_schooling": 50.2, "antenatal_visits": 35.5,
            "vaccination": 60.3, "child_stunting": 43.8, "women_anaemia": 44.2,
        }, "flags": {},
    })
    districts.sort(key=lambda item: (item["state"], item["name"]))
    assert len({item["id"] for item in districts}) == 707
    assert len({item["state"] for item in districts}) == 36
    return {
        "metadata": {
            "title": "NFHS-5 district factsheet data (provisional)",
            "publisher": "Ministry of Health and Family Welfare / International Institute for Population Sciences; Open Government Data Platform India",
            "survey_period": "2019–2021",
            "boundary_reference": "707 survey districts as on 31 March 2017",
            "district_count": 707, "state_ut_count": 36,
            "retrieved_on": "2026-10-02", "source_url": SOURCE_URL,
            "resource_url": RESOURCE_URL,
            "survey_url": "https://www.nfhsiips.in/nfhsuser/nfhs5.php",
            "source_sha256": digest,
            "license": "Government Open Data License – India",
            "license_url": "https://www.data.gov.in/Godl",
            "limitations": [
                "Historical provisional district survey estimates, not current conditions or village observations.",
                "New districts may require their historical parent district; name matching cannot establish a boundary by itself.",
                "Missing values remain null. Small-sample estimates retain an explicit flag.",
                "Improved water source is not a water-quality test; improved sanitation is not simply toilet ownership.",
                "Electricity coverage is not an internet-connectivity measure. Literacy is not language or AI access.",
                "Game characters, queues, service shortages and outcomes are fictional; survey indicators do not establish their causes.",
                "A game win is not an estimate of an AI intervention's real-world effect.",
            ],
            "transformations": [
                "Selected 12 percentage columns; trimmed whitespace from geography labels.",
                "Corrected source state spelling Maharastra to Maharashtra; retained source_state.",
                "Excel negative values displayed in parentheses become positive percentages flagged as 25–49 unweighted cases.",
                "Asterisks become null with the source's fewer-than-25-cases suppression flag.",
                "Preserved the workbook's numeric precision; UI may round for readability.",
                "Replaced erroneous OGD Mizoram/Chandel duplicate row 407 with Saiha's original IIPS district factsheet; per-record source URL and correction details retained.",
            ],
        },
        "indicators": indicators,
        "districts": districts,
    }


if __name__ == "__main__":
    result = build()
    target = DATA / "districts.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(result['districts'])} districts to {target}")
