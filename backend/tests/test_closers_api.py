"""
Receipty Agency - Closer Management System Tests
Tests for Closer CRUD, Commission Tiers, Deals, and Dashboard APIs
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@receipty.ai"
ADMIN_PASSWORD = "Receipty2024!"
CLOSER_EMAIL = "closer1@receipty.ai"
CLOSER_PASSWORD = "Closer123!"


class TestCloserAuthentication:
    """Test closer authentication and role-based access"""
    
    def test_admin_login_returns_correct_role(self):
        """Admin login should return admin/super_admin role"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] in ["admin", "super_admin"]
        print(f"✓ Admin login OK: role={data['role']}")
    
    def test_closer_login_returns_closer_role(self):
        """Closer login should return closer role"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": CLOSER_EMAIL,
            "password": CLOSER_PASSWORD
        })
        assert response.status_code == 200, f"Closer login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "closer"
        print(f"✓ Closer login OK: role={data['role']}")


class TestCommissionTiers:
    """Commission Tiers CRUD tests - Admin only"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            pytest.skip("Admin authentication failed")
    
    def test_list_commission_tiers(self):
        """Test GET /api/admin/commission-tiers - List all tiers"""
        response = requests.get(f"{BASE_URL}/api/admin/commission-tiers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have seeded tiers: Bronze (10%), Silver (12.5%), Gold (15%)
        print(f"✓ Commission tiers: {len(data)} tiers found")
        for tier in data:
            print(f"  - {tier['name']}: {tier['rate']}% (min_deals: {tier['min_deals']})")
        return data
    
    def test_create_commission_tier(self):
        """Test POST /api/admin/commission-tiers - Create new tier"""
        tier_data = {
            "name": "TEST_Platinum",
            "min_deals": 25,
            "rate": 18
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/commission-tiers",
            headers=self.headers,
            json=tier_data
        )
        assert response.status_code == 200, f"Create tier failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Platinum"
        assert data["min_deals"] == 25
        assert data["rate"] == 18
        assert "id" in data
        print(f"✓ Created tier: {data['name']} ({data['rate']}%)")
        return data
    
    def test_update_commission_tier(self):
        """Test PUT /api/admin/commission-tiers/{id} - Update tier"""
        # First create a tier to update
        tiers = self.test_list_commission_tiers()
        test_tiers = [t for t in tiers if "TEST_" in t.get("name", "")]
        
        if not test_tiers:
            # Create one first
            tier_data = {"name": "TEST_UpdateTier", "min_deals": 30, "rate": 20}
            create_resp = requests.post(
                f"{BASE_URL}/api/admin/commission-tiers",
                headers=self.headers,
                json=tier_data
            )
            tier = create_resp.json()
        else:
            tier = test_tiers[0]
        
        # Update the tier
        update_data = {"rate": 22}
        response = requests.put(
            f"{BASE_URL}/api/admin/commission-tiers/{tier['id']}",
            headers=self.headers,
            json=update_data
        )
        assert response.status_code == 200, f"Update tier failed: {response.text}"
        data = response.json()
        assert data["rate"] == 22
        print(f"✓ Updated tier: {data['name']} rate now {data['rate']}%")
    
    def test_delete_commission_tier(self):
        """Test DELETE /api/admin/commission-tiers/{id} - Delete tier"""
        # Get test tiers to delete
        tiers = self.test_list_commission_tiers()
        test_tiers = [t for t in tiers if "TEST_" in t.get("name", "")]
        
        for tier in test_tiers:
            response = requests.delete(
                f"{BASE_URL}/api/admin/commission-tiers/{tier['id']}",
                headers=self.headers
            )
            assert response.status_code == 200, f"Delete tier failed: {response.text}"
            print(f"✓ Deleted tier: {tier['name']}")
    
    def test_closer_cannot_access_tiers(self):
        """Closers should NOT be able to access commission tier endpoints"""
        # Login as closer
        closer_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": CLOSER_EMAIL,
            "password": CLOSER_PASSWORD
        })
        if closer_resp.status_code != 200:
            pytest.skip("Closer login failed")
        
        closer_headers = {"Authorization": f"Bearer {closer_resp.json()['token']}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/commission-tiers", headers=closer_headers)
        assert response.status_code == 403
        print("✓ Closer correctly denied access to commission tiers")


class TestClosersCRUD:
    """Closer management CRUD tests - Admin only"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            pytest.skip("Admin authentication failed")
    
    def test_list_closers(self):
        """Test GET /api/admin/closers - List all closers with stats"""
        response = requests.get(f"{BASE_URL}/api/admin/closers", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Closers list: {len(data)} closers")
        for closer in data:
            print(f"  - {closer['name']} ({closer['email']}): {closer['stats']['deals_signes']} deals signed")
        return data
    
    def test_create_closer(self):
        """Test POST /api/admin/closers - Create new closer account"""
        closer_data = {
            "email": "test_closer@receipty.ai",
            "password": "TestCloser123!",
            "name": "TEST_Closer"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/closers",
            headers=self.headers,
            json=closer_data
        )
        assert response.status_code == 200, f"Create closer failed: {response.text}"
        data = response.json()
        assert data["email"] == "test_closer@receipty.ai"
        assert data["name"] == "TEST_Closer"
        assert data["role"] == "closer"
        assert "password" not in data  # Password should not be returned
        print(f"✓ Created closer: {data['name']} ({data['email']})")
        return data
    
    def test_create_closer_duplicate_email_fails(self):
        """Creating closer with existing email should fail"""
        closer_data = {
            "email": CLOSER_EMAIL,  # Already exists
            "password": "SomePassword123!",
            "name": "Duplicate Closer"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/closers",
            headers=self.headers,
            json=closer_data
        )
        assert response.status_code == 400
        print("✓ Duplicate email correctly rejected")
    
    def test_update_closer(self):
        """Test PUT /api/admin/closers/{id} - Update closer"""
        closers = self.test_list_closers()
        test_closers = [c for c in closers if "TEST_" in c.get("name", "")]
        
        if not test_closers:
            pytest.skip("No test closers to update")
        
        closer = test_closers[0]
        update_data = {"name": "TEST_Closer_Updated"}
        
        response = requests.put(
            f"{BASE_URL}/api/admin/closers/{closer['id']}",
            headers=self.headers,
            json=update_data
        )
        assert response.status_code == 200, f"Update closer failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Closer_Updated"
        print(f"✓ Updated closer: {data['name']}")
    
    def test_delete_closer(self):
        """Test DELETE /api/admin/closers/{id} - Delete closer"""
        closers = self.test_list_closers()
        test_closers = [c for c in closers if "TEST_" in c.get("name", "")]
        
        for closer in test_closers:
            response = requests.delete(
                f"{BASE_URL}/api/admin/closers/{closer['id']}",
                headers=self.headers
            )
            assert response.status_code == 200, f"Delete closer failed: {response.text}"
            print(f"✓ Deleted closer: {closer['name']}")


class TestDealsManagement:
    """Deals CRUD tests - Both Admin and Closer access"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get both admin and closer tokens"""
        # Admin auth
        admin_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if admin_resp.status_code == 200:
            self.admin_token = admin_resp.json()["token"]
            self.admin_headers = {
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            }
        else:
            pytest.skip("Admin authentication failed")
        
        # Closer auth
        closer_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": CLOSER_EMAIL,
            "password": CLOSER_PASSWORD
        })
        if closer_resp.status_code == 200:
            self.closer_token = closer_resp.json()["token"]
            self.closer_headers = {
                "Authorization": f"Bearer {self.closer_token}",
                "Content-Type": "application/json"
            }
        else:
            pytest.skip("Closer authentication failed")
    
    def test_closer_create_deal(self):
        """Test POST /api/deals - Closer can create new deal/prospect"""
        deal_data = {
            "client_name": "TEST_ClientCompany",
            "client_email": "client@testcompany.com",
            "amount_ht": 10000,
            "notes": "Test deal for automated testing"
        }
        response = requests.post(
            f"{BASE_URL}/api/deals",
            headers=self.closer_headers,
            json=deal_data
        )
        assert response.status_code == 200, f"Create deal failed: {response.text}"
        data = response.json()
        assert data["client_name"] == "TEST_ClientCompany"
        assert data["amount_ht"] == 10000
        assert data["status"] == "en_cours"  # New deals start as 'en_cours'
        assert "id" in data
        print(f"✓ Closer created deal: {data['client_name']} ({data['amount_ht']}€)")
        return data
    
    def test_closer_list_own_deals(self):
        """Test GET /api/deals - Closer sees only their own deals"""
        response = requests.get(f"{BASE_URL}/api/deals", headers=self.closer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Closer sees {len(data)} deals")
        return data
    
    def test_admin_list_all_deals(self):
        """Test GET /api/admin/deals - Admin sees all deals"""
        response = requests.get(f"{BASE_URL}/api/admin/deals", headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin sees {len(data)} total deals")
        return data
    
    def test_closer_update_own_en_cours_deal(self):
        """Test PUT /api/deals/{id} - Closer can update their own 'en_cours' deals"""
        # Create a deal first
        deal = self.test_closer_create_deal()
        
        update_data = {
            "client_name": "TEST_ClientCompany_Updated",
            "amount_ht": 12000
        }
        response = requests.put(
            f"{BASE_URL}/api/deals/{deal['id']}",
            headers=self.closer_headers,
            json=update_data
        )
        assert response.status_code == 200, f"Update deal failed: {response.text}"
        data = response.json()
        assert data["client_name"] == "TEST_ClientCompany_Updated"
        assert data["amount_ht"] == 12000
        print(f"✓ Closer updated deal: {data['client_name']} ({data['amount_ht']}€)")
        return data
    
    def test_closer_cannot_validate_deal(self):
        """Closer should NOT be able to validate deals (change to 'signe')"""
        deals = self.test_closer_list_own_deals()
        en_cours_deals = [d for d in deals if d["status"] == "en_cours"]
        
        if not en_cours_deals:
            pytest.skip("No en_cours deals to test")
        
        deal = en_cours_deals[0]
        update_data = {"status": "signe"}
        
        response = requests.put(
            f"{BASE_URL}/api/deals/{deal['id']}",
            headers=self.closer_headers,
            json=update_data
        )
        assert response.status_code == 403
        print("✓ Closer correctly denied from validating deals")
    
    def test_admin_validate_deal(self):
        """Test POST /api/admin/deals/{id}/validate - Admin validates deal"""
        # Get en_cours deals
        deals = self.test_admin_list_all_deals()
        en_cours_deals = [d for d in deals if d["status"] == "en_cours" and "TEST_" in d.get("client_name", "")]
        
        if not en_cours_deals:
            # Create one first
            deal = self.test_closer_create_deal()
        else:
            deal = en_cours_deals[0]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/deals/{deal['id']}/validate",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Validate deal failed: {response.text}"
        data = response.json()
        assert data["status"] == "signe"
        assert data["commission_rate"] > 0
        assert data["commission_amount"] > 0
        assert data["signed_at"] is not None
        
        # Verify commission calculation
        expected_commission = data["amount_ht"] * (data["commission_rate"] / 100)
        assert abs(data["commission_amount"] - expected_commission) < 0.01
        
        print(f"✓ Admin validated deal: {data['client_name']}")
        print(f"  - Amount: {data['amount_ht']}€")
        print(f"  - Commission rate: {data['commission_rate']}%")
        print(f"  - Commission amount: {data['commission_amount']}€")
        return data
    
    def test_commission_calculation_correctness(self):
        """Verify commission is calculated correctly based on tier"""
        # Get commission tiers
        tiers_resp = requests.get(f"{BASE_URL}/api/admin/commission-tiers", headers=self.admin_headers)
        tiers = tiers_resp.json()
        
        # Get a closer's signed deals count
        closers_resp = requests.get(f"{BASE_URL}/api/admin/closers", headers=self.admin_headers)
        closers = closers_resp.json()
        
        for closer in closers:
            signed_count = closer["stats"]["deals_signes"]
            tier_rate = closer["stats"]["current_tier_rate"]
            
            # Find expected tier based on signed deals
            expected_tier = None
            for tier in sorted(tiers, key=lambda t: t["min_deals"], reverse=True):
                if signed_count >= tier["min_deals"]:
                    expected_tier = tier
                    break
            
            if expected_tier:
                assert tier_rate == expected_tier["rate"], f"Tier rate mismatch for {closer['name']}"
                print(f"✓ {closer['name']}: {signed_count} deals = {expected_tier['name']} ({tier_rate}%)")
    
    def test_admin_reject_deal(self):
        """Test POST /api/admin/deals/{id}/reject - Admin marks deal as lost"""
        # Create an en_cours deal
        deal = self.test_closer_create_deal()
        
        response = requests.post(
            f"{BASE_URL}/api/admin/deals/{deal['id']}/reject",
            headers=self.admin_headers
        )
        assert response.status_code == 200, f"Reject deal failed: {response.text}"
        data = response.json()
        assert data["status"] == "perdu"
        print(f"✓ Admin rejected deal: {data['client_name']} (status: {data['status']})")
    
    def test_closer_mark_deal_lost(self):
        """Closer can mark their own deal as lost"""
        deal = self.test_closer_create_deal()
        
        update_data = {"status": "perdu"}
        response = requests.put(
            f"{BASE_URL}/api/deals/{deal['id']}",
            headers=self.closer_headers,
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "perdu"
        print(f"✓ Closer marked deal as lost: {data['client_name']}")
    
    def test_closer_cannot_edit_signed_deal(self):
        """Closer should NOT be able to edit signed deals"""
        deals = self.test_closer_list_own_deals()
        signed_deals = [d for d in deals if d["status"] == "signe"]
        
        if not signed_deals:
            pytest.skip("No signed deals to test")
        
        deal = signed_deals[0]
        update_data = {"amount_ht": 999999}
        
        response = requests.put(
            f"{BASE_URL}/api/deals/{deal['id']}",
            headers=self.closer_headers,
            json=update_data
        )
        assert response.status_code == 403
        print("✓ Closer correctly denied from editing signed deals")


class TestCloserDashboard:
    """Closer personal dashboard tests"""
    
    @pytest.fixture(autouse=True)
    def setup_closer_auth(self):
        """Get closer auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": CLOSER_EMAIL,
            "password": CLOSER_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            pytest.skip("Closer authentication failed")
    
    def test_closer_dashboard(self):
        """Test GET /api/closer/dashboard - Get closer's personal dashboard data"""
        response = requests.get(f"{BASE_URL}/api/closer/dashboard", headers=self.headers)
        assert response.status_code == 200, f"Dashboard fetch failed: {response.text}"
        data = response.json()
        
        # Validate structure
        assert "user" in data
        assert "stats" in data
        assert "recent_deals" in data
        assert "tiers" in data
        assert "next_tier" in data or data["next_tier"] is None
        assert "deals_to_next_tier" in data
        
        # Validate stats
        stats = data["stats"]
        assert "total_deals" in stats
        assert "deals_signes" in stats
        assert "deals_en_cours" in stats
        assert "total_ca" in stats
        assert "total_commission" in stats
        assert "current_tier_name" in stats
        assert "current_tier_rate" in stats
        
        print(f"✓ Closer dashboard:")
        print(f"  - User: {data['user']['name']} ({data['user']['email']})")
        print(f"  - Tier: {stats['current_tier_name']} ({stats['current_tier_rate']}%)")
        print(f"  - Deals: {stats['total_deals']} total, {stats['deals_signes']} signed")
        print(f"  - CA: {stats['total_ca']}€")
        print(f"  - Commission: {stats['total_commission']}€")
        return data
    
    def test_closer_monthly_stats(self):
        """Test GET /api/closer/monthly-stats - Get monthly statistics"""
        response = requests.get(f"{BASE_URL}/api/closer/monthly-stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Monthly stats: {len(data)} months of data")


class TestStatsAfterValidation:
    """Tests to verify stats are updated correctly after deal validation"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup both admin and closer auth"""
        # Admin
        admin_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if admin_resp.status_code == 200:
            self.admin_token = admin_resp.json()["token"]
            self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        else:
            pytest.skip("Admin auth failed")
        
        # Closer
        closer_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": CLOSER_EMAIL,
            "password": CLOSER_PASSWORD
        })
        if closer_resp.status_code == 200:
            self.closer_token = closer_resp.json()["token"]
            self.closer_headers = {"Authorization": f"Bearer {self.closer_token}"}
        else:
            pytest.skip("Closer auth failed")
    
    def test_stats_update_after_validation(self):
        """Verify stats are updated after deal validation"""
        # Get initial stats
        dashboard_before = requests.get(
            f"{BASE_URL}/api/closer/dashboard",
            headers=self.closer_headers
        ).json()
        
        initial_signed = dashboard_before["stats"]["deals_signes"]
        initial_commission = dashboard_before["stats"]["total_commission"]
        initial_ca = dashboard_before["stats"]["total_ca"]
        
        # Create and validate a new deal
        deal_data = {
            "client_name": "TEST_StatsTest_Company",
            "client_email": "statstest@company.com",
            "amount_ht": 5000,
            "notes": "Test for stats verification"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/deals",
            headers=self.closer_headers,
            json=deal_data
        )
        deal = create_resp.json()
        
        # Validate the deal
        validate_resp = requests.post(
            f"{BASE_URL}/api/admin/deals/{deal['id']}/validate",
            headers=self.admin_headers
        )
        validated_deal = validate_resp.json()
        
        # Get updated stats
        dashboard_after = requests.get(
            f"{BASE_URL}/api/closer/dashboard",
            headers=self.closer_headers
        ).json()
        
        # Verify stats increased
        assert dashboard_after["stats"]["deals_signes"] == initial_signed + 1
        assert dashboard_after["stats"]["total_ca"] == initial_ca + 5000
        assert dashboard_after["stats"]["total_commission"] == initial_commission + validated_deal["commission_amount"]
        
        print(f"✓ Stats updated correctly after validation:")
        print(f"  - Signed deals: {initial_signed} → {dashboard_after['stats']['deals_signes']}")
        print(f"  - Total CA: {initial_ca}€ → {dashboard_after['stats']['total_ca']}€")
        print(f"  - Commission: {initial_commission}€ → {dashboard_after['stats']['total_commission']}€")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_cleanup_test_deals(self):
        """Delete all test deals"""
        deals_resp = requests.get(f"{BASE_URL}/api/admin/deals", headers=self.headers)
        deals = deals_resp.json()
        test_deals = [d for d in deals if "TEST_" in d.get("client_name", "")]
        
        for deal in test_deals:
            requests.delete(f"{BASE_URL}/api/deals/{deal['id']}", headers=self.headers)
            print(f"✓ Deleted test deal: {deal['client_name']}")
    
    def test_cleanup_test_closers(self):
        """Delete all test closers"""
        closers_resp = requests.get(f"{BASE_URL}/api/admin/closers", headers=self.headers)
        closers = closers_resp.json()
        test_closers = [c for c in closers if "TEST_" in c.get("name", "")]
        
        for closer in test_closers:
            requests.delete(f"{BASE_URL}/api/admin/closers/{closer['id']}", headers=self.headers)
            print(f"✓ Deleted test closer: {closer['name']}")
    
    def test_cleanup_test_tiers(self):
        """Delete all test tiers"""
        tiers_resp = requests.get(f"{BASE_URL}/api/admin/commission-tiers", headers=self.headers)
        tiers = tiers_resp.json()
        test_tiers = [t for t in tiers if "TEST_" in t.get("name", "")]
        
        for tier in test_tiers:
            requests.delete(f"{BASE_URL}/api/admin/commission-tiers/{tier['id']}", headers=self.headers)
            print(f"✓ Deleted test tier: {tier['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
