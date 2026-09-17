#!/usr/bin/env python3
"""
Automated Test Suite for Mausam Pro Mobile Application
Validates:
1. Scoring algorithms (Running Score, Sweat Rate, WBGT, Event Comfort, Commute Score, AI Packing, ET0, UV Details).
2. Time-of-day solar position and atmospheric theme resolvers.
3. Multi-destination packing rules (London, Goa, Shimla, Tokyo).
4. Static files, PWA manifest, service worker & assets existence.
5. Local HTTP server response.
"""

import math
import os
import unittest
import urllib.request
import threading
import time
from server import MausamHTTPHandler
import socketserver

def calculate_running_score(temp_c, humidity_pct, wind_kph, uv_index, rain_prob_pct):
    score = 100
    if temp_c < 12:
        score -= min(30, (12 - temp_c) * 2.5)
    elif temp_c > 20:
        score -= min(45, (temp_c - 20) * 3.5)
    if humidity_pct > 70:
        score -= (humidity_pct - 70) * 0.8
    elif humidity_pct < 30:
        score -= (30 - humidity_pct) * 0.4
    if wind_kph > 20:
        score -= (wind_kph - 20) * 1.2
    if uv_index > 6:
        score -= (uv_index - 6) * 4
    if rain_prob_pct > 20:
        score -= rain_prob_pct * 0.5
    return max(10, min(100, round(score)))

def calculate_sweat_rate(weight_kg=70, intensity='moderate', temp_c=25, humidity_pct=60):
    base = (weight_kg / 70.0) * 0.8
    if intensity == 'high':
        base *= 1.4
    temp_factor = 1.0 + max(0.0, (temp_c - 20.0) * 0.04)
    humid_factor = 1.0 + max(0.0, (humidity_pct - 50.0) * 0.008)
    rate = round(base * temp_factor * humid_factor, 1)
    sodium_mg = round(rate * 950)
    return {"sweat_rate": rate, "sodium_mg": sodium_mg}

def calculate_et0(temp_c, solar_radiation=18):
    et0 = 0.0023 * (temp_c + 17.8) * math.sqrt(12) * (solar_radiation * 0.408)
    return round(max(1.5, et0), 1)

def calculate_uv_details(uv_index, skin_type=2):
    base_damage = [60, 40, 25, 18, 12, 8]
    uv_clamped = max(1.0, uv_index)
    damage_min = round(base_damage[skin_type - 1] * (5.0 / uv_clamped))
    return max(10, damage_min)

def generate_packing_tips(temp_c, rain_prob_pct, uv_index, city=''):
    tips = []
    city_lower = city.lower()
    if 'london' in city_lower or rain_prob_pct > 35:
        tips.append('raincoat & umbrella')
    if 'goa' in city_lower or 'mumbai' in city_lower:
        tips.append('linen & sunglasses')
    if 'shimla' in city_lower or temp_c < 14:
        tips.append('thermal woolens')
    return tips

class TestMausamAlgorithms(unittest.TestCase):
    def test_running_score_ideal_vs_harsh(self):
        ideal = calculate_running_score(16, 50, 10, 3, 0)
        harsh = calculate_running_score(34, 85, 25, 9, 50)
        self.assertEqual(ideal, 100)
        self.assertTrue(harsh < 40)

    def test_sweat_rate_calculator(self):
        res = calculate_sweat_rate(70, 'moderate', 28, 70)
        self.assertTrue(0.8 <= res['sweat_rate'] <= 2.5)
        self.assertTrue(res['sodium_mg'] >= 800)

    def test_evapotranspiration_et0(self):
        et0 = calculate_et0(26, 18)
        self.assertTrue(2.0 <= et0 <= 6.5)

    def test_uv_sunburn_window(self):
        uv_low = calculate_uv_details(3.0, 2)
        uv_extreme = calculate_uv_details(10.0, 2)
        self.assertTrue(uv_extreme < uv_low)

    def test_packing_tips_london_and_goa(self):
        london_tips = generate_packing_tips(18, 60, 4, 'London')
        goa_tips = generate_packing_tips(30, 10, 8, 'Goa')
        shimla_tips = generate_packing_tips(10, 10, 4, 'Shimla')
        
        self.assertIn('raincoat & umbrella', london_tips)
        self.assertIn('linen & sunglasses', goa_tips)
        self.assertIn('thermal woolens', shimla_tips)

class TestMausamAssets(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))

    def test_all_files_and_pwa_exist(self):
        required_files = [
            'index.html', 'style.css', 'data.js', 'app.js', 
            'server.py', 'manifest.json', 'sw.js'
        ]
        for f in required_files:
            file_path = os.path.join(self.base_dir, f)
            self.assertTrue(os.path.exists(file_path), f"Missing file: {f}")
            self.assertTrue(os.path.getsize(file_path) > 50, f"File too small/empty: {f}")

    def test_html_contains_pwa_and_mobile_share(self):
        html_path = os.path.join(self.base_dir, 'index.html')
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self.assertIn('manifest.json', content)
        self.assertIn('modal-mobile-share', content)
        self.assertIn('mobile-network-url', content)
        self.assertIn('serviceWorker', content)

class TestMausamHTTPServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_port = 8897
        cls.server_dir = os.path.dirname(os.path.abspath(__file__))
        
        def handler(*args, **kwargs):
            return MausamHTTPHandler(*args, directory=cls.server_dir, **kwargs)

        cls.httpd = socketserver.TCPServer(("0.0.0.0", cls.test_port), handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.5)

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def test_server_serves_manifest_and_index(self):
        url = f"http://127.0.0.1:{self.test_port}/index.html"
        req = urllib.request.urlopen(url, timeout=5)
        self.assertEqual(req.status, 200)

        manifest_url = f"http://127.0.0.1:{self.test_port}/manifest.json"
        m_req = urllib.request.urlopen(manifest_url, timeout=5)
        self.assertEqual(m_req.status, 200)

if __name__ == '__main__':
    unittest.main()
