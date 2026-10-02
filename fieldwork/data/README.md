# Fieldwork's public evidence

`districts.json` contains 12 indicators for all **707 NFHS-5 survey districts** across 36 states and union territories. The period is **2019–2021**. These are **provisional district estimates**, not present-day measurements or observations of a particular village.

The source is the Ministry of Health and Family Welfare / International Institute for Population Sciences release on India's Open Government Data platform:

- [Official resource and definitions](https://www.data.gov.in/resource/india-districts-factsheets-national-family-health-survey-nfhs-5-2019-2021-provisional).
- [Original XLS download](https://data.gov.in/files/ogdpv2dms/s3fs-public/datafile/NFHS_5_India_Districts_Factsheet_Data.xls), also preserved here, retrieved 2 October 2026.
- [IIPS survey description](https://www.nfhsiips.in/nfhsuser/nfhs5.php), which identifies the survey geography as the 707 districts existing on 31 March 2017 and distinguishes provisional factsheets from final reports.
- [Government Open Data License – India](https://www.data.gov.in/Godl). Source ownership remains with the publishing government bodies. This game has no government endorsement.

Source SHA-256: `e482b990d74eb46b5ce5a6e10606b745a914d4b1b57838c1c6149e80ec8ad498`.

The bundled workbook, rather than a secondary CSV mirror, is the source of all but one district's numbers. The explicitly documented Saiha correction below comes from its original IIPS district factsheet. The workbook's figures may differ from later/final factsheets. We preserve its precision and provisional status instead of silently mixing releases.

## Transformations and checks

`fieldwork/build_data.py` selects 12 columns, trims geography whitespace, and corrects the source spelling `Maharastra` to `Maharashtra`. Each row retains the original state label, workbook row number and source indicator labels. No geographical joins, interpolations, district averages or invented missing values are involved in this data build.

The workbook stores some percentages as **negative numbers displayed in parentheses** using Excel's `0.0_);\(0.0\)` format. The source notes identify parentheses as estimates based on 25–49 unweighted cases. The builder verifies this exact format, converts these cells to their positive displayed value and retains a small-sample flag. It does not interpret them as negative rates. There are 234 such cells among the selected indicators.

The 13 suppressed vaccination estimates marked `*` remain `null`, flagged as fewer than 25 unweighted cases. They must never be converted to zero coverage or offered as a known local percentage. All other selected cells have values. The builder checks 707 unique district IDs, 36 states/UTs, source headers, the source checksum and the 0–100 range of each percentage.

### A primary-source error corrected explicitly

Workbook row 407 lists **Chandel, Mizoram**, copying all 12 selected indicators from **Chandel, Manipur** (row 395). Saiha is missing. A complete duplicate-vector audit of the 707 source rows found only this pair. Renaming this row would assign Manipur's values to Saiha.

Instead, the complete erroneous row is replaced with all 12 indicators from [IIPS's original Saiha district factsheet](https://www.nfhsiips.in/assets/publication/NFHS-5/DistFact/Mizoram/Saiha/NFHS-5_DistFact_Mizoram_Saiha__Saiha.pdf), PDF pages 3–5. The original PDF is bundled as `NFHS-5_DistFact_Mizoram_Saiha.pdf`; SHA-256: `822e94234bc655b0a9898089fdf933cde294e5722af4c0adb92900f6c873e07c`. It covers Saiha's 2019 fieldwork and publishes one-decimal values. For example, vaccination coverage is 60.3%, at least four antenatal visits 35.5%, and improved sanitation 91.5%. The JSON record preserves its separate `source_url` and `source_override` attribution, with no XLS source-row claim. No selected Saiha indicator is parenthesized or suppressed in this factsheet.

To reproduce (no dependency is needed to play):

```sh
uv run --with xlrd==2.0.2 python fieldwork/build_data.py
```

## Interpretation boundaries

An improved drinking-water source is not proof of water safety. Improved sanitation is a survey definition, not simply ownership of a toilet. Electricity coverage is not an internet-access measure. Adult literacy is not a language, smartphone or AI-skill measure. District percentages cannot establish why any individual did not receive a service.

Place lookup belongs to a separate geographical layer. New administrative districts may need their historical parent district; matching a similar name alone does not establish that relationship. The game should show the selected survey district and ask the player to confirm any unresolved mapping.

Characters, reported conversations, queues, shortages and outcomes in the game are fictional. These indicators ground the setting, not the game's causal or numerical claims. A successful game run is not a forecast of an AI intervention's effect.
