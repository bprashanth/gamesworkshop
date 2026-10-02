"""Location contracts: real polygons, offline village names, honest survey matching."""
import unittest
from unittest.mock import patch

from fieldwork import places as p


class CoordinateTests(unittest.TestCase):
    def test_coordinate_input_and_map_links(self):
        for query in ('12.9716,77.5946', '12.9716 77.5946',
                      'https://www.google.com/maps/@12.9716,77.5946,14z',
                      'https://maps.google.com/?q=12.9716%2C77.5946',
                      'https://www.openstreetmap.org/#map=14/12.9716/77.5946'):
            with self.subTest(query=query):
                self.assertEqual(p.parse_coordinates(query), (12.9716, 77.5946))
        with self.assertRaises(ValueError):
            p.parse_coordinates('99,77')
        self.assertIsNone(p.parse_coordinates('Bengaluru'))
        self.assertEqual(p.parse_coordinates(
            'https://www.google.com/maps/place/x/@12,77,10z/data=!3d13!4d78'), (13, 78))

    def test_coordinates_match_containing_district_not_nearest_city(self):
        for coordinates, district, state in [
            ((12.9716, 77.5946), 'Bangalore', 'Karnataka'),
            ((19.076, 72.8777), 'Mumbai Suburban', 'Maharashtra'),
            ((24.5854, 73.7125), 'Udaipur', 'Rajasthan'),
            ((31.1048, 77.1734), 'Shimla', 'Himachal Pradesh'),
            ((34.1526, 77.577), 'Leh(Ladakh)', 'Ladakh'),
            ((10.5667, 72.6417), 'Lakshadweep', 'Lakshadweep'),
        ]:
            with self.subTest(coordinates=coordinates):
                place = p.reverse(*coordinates)
                self.assertEqual((place['district'], place['state']), (district, state))
                self.assertIsNotNone(p.match_district(place))
                self.assertIn('2021', place['note'])

    def test_foreign_and_water_points_inside_india_bbox_are_not_india(self):
        for coordinates in [(28, 84), (23.8103, 90.4125), (31.52, 74.36), (15, 72), (0, 80)]:
            with self.subTest(coordinates=coordinates):
                self.assertIsNone(p.reverse(*coordinates))
        for coordinates in [(float('nan'), 77), (12, float('inf')), (91, 77)]:
            with self.assertRaises(ValueError):
                p.reverse(*coordinates)

    def test_polygon_hole_and_island(self):
        shape = {'bbox': [0, 0, 6, 6], 'type': 'MultiPolygon', 'coordinates': [
            [[[0,0],[4,0],[4,4],[0,4],[0,0]], [[1,1],[3,1],[3,3],[1,3],[1,1]]],
            [[[5,5],[6,5],[6,6],[5,6],[5,5]]],
        ]}
        self.assertTrue(p.contains(shape, .5, .5))
        self.assertFalse(p.contains(shape, 2, 2))
        self.assertTrue(p.contains(shape, 5.5, 5.5))
        self.assertFalse(p.contains(shape, 4.5, 4.5))

    def test_overlapping_districts_are_not_silently_resolved(self):
        shape = {'bbox': [0,0,2,2], 'type': 'Polygon',
                 'coordinates': [[[0,0],[2,0],[2,2],[0,2],[0,0]]]}
        geo = {'states': [dict(shape, name='Test State')],
               'districts': [dict(shape, name='A'), dict(shape, name='B')]}
        with patch.object(p, '_geography', return_value=geo):
            place = p.reverse(1, 1)
        self.assertEqual(place['district'], '')
        self.assertEqual(place['district_candidates'], ['A', 'B'])
        self.assertIn('ambiguity', place['note'])

    def test_telangana_and_enclave_state_membership(self):
        hyderabad = p.reverse(17.385, 78.486)
        self.assertEqual(hyderabad['state'], 'Telangana')
        self.assertEqual(p.match_district(hyderabad)['id'], 'telangana-hyderabad')
        yanam = p.reverse(16.7, 82.27)
        self.assertEqual(yanam['state'], 'Puducherry')
        self.assertEqual(p.match_district(yanam)['id'], 'puducherry-yanam')
        # Disagreement between separately simplified layers must not attach
        # Andhra Pradesh evidence to a point the state layer puts in Puducherry.
        edge = p.reverse(16.730, 82.222)
        self.assertIsNone(p.match_district(edge))
        self.assertIsNone(p.parent_district_context(edge))

    def test_documented_source_label_swap_is_corrected_without_changing_geometry(self):
        kancheepuram = p.reverse(12.8342, 79.7036)
        chengalpattu = p.reverse(12.6819, 79.9888)
        self.assertEqual(kancheepuram['district'], 'Kancheepuram')
        self.assertEqual(chengalpattu['district'], 'Chengalputtu')
        self.assertIsNone(p.match_district(chengalpattu))
        self.assertEqual(p.parent_district_context(chengalpattu)['district']['id'],
                         'tamil-nadu-kancheepuram')
        corrected = [r for r in p._geography()['districts'] if 'original_name' in r]
        self.assertEqual(len(corrected), 2)
        self.assertTrue(p._geography()['metadata']['label_corrections'][0]['source_urls'])

    def test_official_parent_context_is_separate_from_a_direct_survey_match(self):
        for relationship in p._parent_contexts():
            with self.subTest(district=relationship['district']):
                self.assertIsNone(p.match_district(relationship))
                context = p.parent_district_context(relationship)
                self.assertIsNotNone(context)
                self.assertEqual(context['district']['id'], relationship['parent_id'])
                self.assertEqual(context['source_url'], relationship['source_url'])
                self.assertIn('not an estimate', context['note'])
                self.assertIn('parent district context', context['note'])
        self.assertIsNone(p.parent_district_context({'state': 'West Bengal', 'district': 'Barddhaman'}))
        self.assertIsNone(p.parent_district_context({'state': 'Arunachal Pradesh', 'district': 'Lower Siang'}))
        self.assertIsNone(p.parent_district_context({'state': 'Rajasthan', 'district': 'Niwari'}))
        self.assertIsNone(p.parent_district_context({'state': 'Rajasthan', 'district': 'Udaipur'}))

    def test_new_district_does_not_inherit_nearest_parent_data(self):
        place = p.reverse(25.366, 78.797)
        self.assertEqual(place['district'], 'Niwari')
        self.assertIsNone(p.match_district(place))


class PlaceNameTests(unittest.TestCase):
    def test_district_names_work_without_loading_large_gazetteer(self):
        with patch.object(p, '_gazetteer', side_effect=AssertionError('unnecessary load')):
            result = p.geocode('Bengaluru')
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['district'], 'Bangalore')
        self.assertIsNone(result[0]['lat'])
        self.assertIn('district', result[0]['name'])

    def test_same_name_districts_require_choice_and_state_can_narrow(self):
        matches = p.geocode('Aurangabad')
        self.assertEqual({x['state'] for x in matches}, {'Bihar', 'Maharashtra'})
        self.assertEqual([x['state'] for x in p.geocode('Aurangabad, Bihar')], ['Bihar'])

    def test_real_settlements_are_available_offline(self):
        for query, state, district in [('Dharavi', 'Maharashtra', 'Mumbai'),
                                       ('Pileru', 'Andhra Pradesh', 'Chittoor'),
                                       ('Kavaratti', 'Lakshadweep', 'Lakshadweep')]:
            with self.subTest(query=query):
                rows = p.geocode(query)
                self.assertTrue(rows)
                self.assertEqual((rows[0]['state'], rows[0]['district']), (state, district))
                self.assertTrue(rows[0]['source_url'].startswith('https://www.geonames.org/'))

    def test_ambiguous_settlement_names_keep_alternatives(self):
        rows = p.geocode('Rampur, Himachal Pradesh')
        self.assertGreater(len(rows), 1)
        self.assertTrue(all(x['state'] == 'Himachal Pradesh' for x in rows))
        self.assertGreater(len({(x['lat'], x['lon']) for x in rows}), 1)

    def test_unknown_name_does_not_invent_a_place(self):
        self.assertEqual(p.geocode('NoSuchVillageEver'), [])
        self.assertEqual(p.geocode(''), [])
        self.assertEqual(p.geocode('28,84'), [])

    def test_matching_requires_state_and_district_not_just_name(self):
        self.assertIsNone(p.match_district({'district': 'Udaipur', 'state': 'Karnataka'}))
        self.assertIsNone(p.match_district({'district': 'Udaipur', 'state': ''}))
        row = p.match_district({'district': 'Bijapur', 'state': 'Chhattisgarh'})
        self.assertEqual(row['state'], 'Chhattisgarh')
        row = p.match_district({'district': 'Bengaluru Urban', 'state': 'Karnataka'})
        self.assertEqual(row['name'], 'Bangalore')

    def test_all_survey_districts_are_reachable_by_explicit_name_and_state(self):
        for district in p.load_districts():
            matches = p.search_districts(f"{district['name']}, {district['state']}")
            self.assertIn(district, matches)


if __name__ == '__main__':
    unittest.main()
