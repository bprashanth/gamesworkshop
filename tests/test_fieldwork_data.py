"""Integrity contracts for the historical public evidence bundled with Fieldwork.

The fixtures below were checked against the original OGD workbook. Running
these tests needs neither network access nor the build-time xlrd package.
"""

import hashlib
import json
from pathlib import Path
import unittest


DATA = Path(__file__).resolve().parents[1] / "fieldwork" / "data"


class PublicEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = json.loads((DATA / "districts.json").read_text())
        cls.records = cls.dataset["districts"]
        cls.by_id = {row["id"]: row for row in cls.records}

    def test_source_is_the_pinned_original_government_workbook(self):
        digest = hashlib.sha256((DATA / "NFHS_5_India_Districts_Factsheet_Data.xls").read_bytes()).hexdigest()
        self.assertEqual(digest, "e482b990d74eb46b5ce5a6e10606b745a914d4b1b57838c1c6149e80ec8ad498")
        self.assertEqual(self.dataset["metadata"]["source_sha256"], digest)
        self.assertTrue(self.dataset["metadata"]["source_url"].startswith("https://data.gov.in/"))

    def test_all_survey_districts_and_union_territories_are_covered(self):
        self.assertEqual(len(self.records), 707)
        self.assertEqual(len(self.by_id), 707)
        self.assertEqual(len({row["state"] for row in self.records}), 36)
        self.assertIn("chandigarh-chandigarh", self.by_id)
        self.assertIn("lakshadweep-lakshadweep", self.by_id)
        self.assertEqual({row["source_row"] for row in self.records if row["source_row"] is not None}, set(range(2, 709)) - {407})

    def test_percentages_and_scope_are_preserved(self):
        expected_keys = set(self.dataset["indicators"])
        self.assertEqual(len(expected_keys), 12)
        for row in self.records:
            with self.subTest(district=row["id"]):
                self.assertEqual(set(row["indicators"]), expected_keys)
                self.assertEqual(row["geography_level"], "district")
                self.assertLessEqual(set(row["flags"]), expected_keys)
                for value in row["indicators"].values():
                    if value is not None:
                        self.assertGreaterEqual(value, 0)
                        self.assertLessEqual(value, 100)

    def test_suppressed_estimates_are_missing_not_zero_or_imputed(self):
        # Source column 54 marks exactly these 13 estimates with an asterisk.
        expected = {
            "andaman-nicobar-islands-north-middle-andaman", "goa-south-goa",
            "haryana-sirsa", "kerala-kottayam", "kerala-pathanamthitta",
            "kerala-thrissur", "madhya-pradesh-bhopal", "madhya-pradesh-jabalpur",
            "madhya-pradesh-raisen", "maharashtra-mumbai", "maharashtra-mumbai-suburban",
            "sikkim-east-district", "tamil-nadu-tiruppur",
        }
        missing = {(row["id"], key) for row in self.records for key, value in row["indicators"].items() if value is None}
        self.assertEqual(missing, {(district, "vaccination") for district in expected})
        for district in expected:
            self.assertEqual(self.by_id[district]["flags"]["vaccination"], "Suppressed: fewer than 25 unweighted cases")

    def test_parenthesized_excel_values_keep_small_sample_flags(self):
        flagged = [(row, key) for row in self.records for key, flag in row["flags"].items() if flag == "Based on 25–49 unweighted cases"]
        self.assertEqual(len(flagged), 234)
        pune = self.by_id["maharashtra-pune"]
        # Original XLS row 374, column 54: -58.08 displayed as (58.1).
        self.assertEqual(pune["indicators"]["vaccination"], 58.08)
        self.assertEqual(pune["flags"]["vaccination"], "Based on 25–49 unweighted cases")
        self.assertNotIn("vaccination", self.by_id["maharashtra-nandurbar"]["flags"])

    def test_independent_primary_source_spot_checks(self):
        # Values read directly from official XLS cells, not a secondary mirror.
        fixtures = {
            "maharashtra-nandurbar": {"sanitation": 54.09, "antenatal_visits": 58.17, "vaccination": 72.4},
            "bihar-gaya": {"birth_registration": 70.65, "antenatal_visits": 25.07},
            "karnataka-bangalore": {"sanitation": 90.41, "vaccination": 78.16},
            "chandigarh-chandigarh": {"women_literacy": 82.96, "vaccination": 80.93},
            "lakshadweep-lakshadweep": {"birth_registration": 100.0, "vaccination": 86.14},
        }
        for district, indicators in fixtures.items():
            for key, value in indicators.items():
                with self.subTest(district=district, indicator=key):
                    self.assertEqual(self.by_id[district]["indicators"][key], value)

    def test_known_erroneous_government_duplicate_is_replaced_from_primary_pdf(self):
        self.assertNotIn("mizoram-chandel", self.by_id)
        self.assertIn("manipur-chandel", self.by_id)
        saiha = self.by_id["mizoram-saiha"]
        self.assertEqual(saiha["indicators"]["vaccination"], 60.3)
        self.assertEqual(saiha["indicators"]["antenatal_visits"], 35.5)
        self.assertEqual(saiha["indicators"]["sanitation"], 91.5)
        self.assertEqual(saiha["source_override"]["replaced_source_row"], 407)
        self.assertIsNone(saiha["source_row"])
        self.assertTrue(saiha["source_url"].startswith("https://www.nfhsiips.in/"))
        self.assertEqual(hashlib.sha256((DATA / "NFHS-5_DistFact_Mizoram_Saiha.pdf").read_bytes()).hexdigest(), saiha["source_override"]["source_sha256"])
        # The complete selected indicator vector revealed the source's
        # cross-state copy error. No duplicate vectors remain after correction.
        self.assertEqual(len({tuple(sorted(row["indicators"].items())) for row in self.records}), 707)

    def test_data_is_labelled_historical_provisional_and_not_village_data(self):
        metadata = self.dataset["metadata"]
        self.assertIn("provisional", metadata["title"])
        self.assertEqual(metadata["survey_period"], "2019–2021")
        self.assertIn("31 March 2017", metadata["boundary_reference"])
        self.assertTrue(any("not current conditions or village" in item for item in metadata["limitations"]))

    def test_no_connectivity_or_ai_effect_is_fabricated_from_survey(self):
        self.assertNotIn("internet", self.dataset["indicators"])
        self.assertNotIn("connectivity", self.dataset["indicators"])
        limitations = " ".join(self.dataset["metadata"]["limitations"])
        self.assertIn("Electricity coverage is not an internet-connectivity measure", limitations)
        self.assertIn("not an estimate of an AI intervention", limitations)
        self.assertEqual(self.dataset["indicators"]["vaccination"]["direction"], "coverage")
        self.assertEqual(self.dataset["indicators"]["child_stunting"]["direction"], "burden")


if __name__ == "__main__":
    unittest.main()
