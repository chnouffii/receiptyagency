import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://receipty-agency.preview.emergentagent.com/api"

class ReceiptyCoreAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.test_lead_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, passed, details="", error_msg=""):
        """Log test results"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name}: PASSED {details}")
        else:
            self.failed_tests.append({"test": test_name, "error": error_msg, "details": details})
            print(f"❌ {test_name}: FAILED - {error_msg}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 200 and "Receipty Agency API" in response.json().get("message", ""):
                self.log_result("API Root", True, f"Status: {response.status_code}")
                return True
            else:
                self.log_result("API Root", False, f"Status: {response.status_code}", "Unexpected response")
                return False
        except Exception as e:
            self.log_result("API Root", False, "", f"Exception: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login with valid credentials"""
        try:
            payload = {
                "email": "admin@receipty.ai",
                "password": "Receipty2024!"
            }
            response = requests.post(f"{self.base_url}/admin/login", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "email" in data:
                    self.admin_token = data["token"]
                    self.log_result("Admin Login", True, f"Token received for {data['email']}")
                    return True
                else:
                    self.log_result("Admin Login", False, "", "Missing token or email in response")
                    return False
            else:
                self.log_result("Admin Login", False, f"Status: {response.status_code}", "Authentication failed")
                return False
        except Exception as e:
            self.log_result("Admin Login", False, "", f"Exception: {str(e)}")
            return False

    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        try:
            payload = {
                "email": "admin@receipty.ai",
                "password": "wrongpassword"
            }
            response = requests.post(f"{self.base_url}/admin/login", json=payload, timeout=10)
            if response.status_code == 401:
                self.log_result("Admin Login Invalid", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_result("Admin Login Invalid", False, f"Status: {response.status_code}", "Should reject invalid credentials with 401")
                return False
        except Exception as e:
            self.log_result("Admin Login Invalid", False, "", f"Exception: {str(e)}")
            return False

    def test_create_lead(self):
        """Test creating a new lead"""
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            payload = {
                "name": f"Test User {timestamp}",
                "email": f"test{timestamp}@example.com",
                "company": f"Test Company {timestamp}",
                "phone": "+1234567890",
                "category": "talent",
                "company_size": 50,
                "features": ["Screening automatise", "Matching IA"],
                "estimated_setup": 3000,
                "estimated_monthly": 199,
                "language": "fr"
            }
            response = requests.post(f"{self.base_url}/leads", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["email"] == payload["email"]:
                    self.test_lead_id = data["id"]
                    self.log_result("Create Lead", True, f"Lead created with ID: {self.test_lead_id}")
                    return True
                else:
                    self.log_result("Create Lead", False, "", "Missing ID or email mismatch in response")
                    return False
            else:
                self.log_result("Create Lead", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Lead", False, "", f"Exception: {str(e)}")
            return False

    def test_get_leads_unauthorized(self):
        """Test getting leads without authorization"""
        try:
            response = requests.get(f"{self.base_url}/leads", timeout=10)
            if response.status_code == 401:
                self.log_result("Get Leads Unauthorized", True, "Correctly requires authorization")
                return True
            else:
                self.log_result("Get Leads Unauthorized", False, f"Status: {response.status_code}", "Should require authorization")
                return False
        except Exception as e:
            self.log_result("Get Leads Unauthorized", False, "", f"Exception: {str(e)}")
            return False

    def test_get_leads_authorized(self):
        """Test getting leads with valid authorization"""
        if not self.admin_token:
            self.log_result("Get Leads Authorized", False, "", "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/leads", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Leads Authorized", True, f"Retrieved {len(data)} leads")
                    return True
                else:
                    self.log_result("Get Leads Authorized", False, "", "Response is not a list")
                    return False
            else:
                self.log_result("Get Leads Authorized", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Leads Authorized", False, "", f"Exception: {str(e)}")
            return False

    def test_get_admin_stats(self):
        """Test getting admin statistics"""
        if not self.admin_token:
            self.log_result("Get Admin Stats", False, "", "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/stats", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_leads", "new_leads", "contacted", "qualified", "converted", "total_setup_revenue", "total_monthly_revenue"]
                if all(key in data for key in required_keys):
                    self.log_result("Get Admin Stats", True, f"Stats retrieved with {data['total_leads']} total leads")
                    return True
                else:
                    missing = [key for key in required_keys if key not in data]
                    self.log_result("Get Admin Stats", False, "", f"Missing keys: {missing}")
                    return False
            else:
                self.log_result("Get Admin Stats", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Admin Stats", False, "", f"Exception: {str(e)}")
            return False

    def test_update_lead_status(self):
        """Test updating lead status"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Update Lead Status", False, "", "Missing admin token or test lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"status": "contacted"}
            response = requests.patch(f"{self.base_url}/leads/{self.test_lead_id}/status", json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "contacted":
                    self.log_result("Update Lead Status", True, "Status updated to contacted")
                    return True
                else:
                    self.log_result("Update Lead Status", False, "", "Status not updated correctly")
                    return False
            else:
                self.log_result("Update Lead Status", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Lead Status", False, "", f"Exception: {str(e)}")
            return False

    def test_delete_lead(self):
        """Test deleting a lead"""
        if not self.admin_token or not self.test_lead_id:
            self.log_result("Delete Lead", False, "", "Missing admin token or test lead ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(f"{self.base_url}/leads/{self.test_lead_id}", headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data.get("message", "").lower():
                    self.log_result("Delete Lead", True, "Lead deleted successfully")
                    return True
                else:
                    self.log_result("Delete Lead", False, "", "Unexpected delete response")
                    return False
            else:
                self.log_result("Delete Lead", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Delete Lead", False, "", f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Receipty Agency API Tests")
        print("=" * 50)
        
        # Basic API connectivity
        self.test_api_root()
        
        # Authentication tests
        self.test_admin_login_invalid()
        self.test_admin_login()
        
        # Lead management tests
        self.test_create_lead()
        self.test_get_leads_unauthorized()
        self.test_get_leads_authorized()
        self.test_get_admin_stats()
        self.test_update_lead_status()
        self.test_delete_lead()
        
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Passed Tests: {', '.join(self.passed_tests)}")
        
        if self.failed_tests:
            print(f"❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ReceiptyCoreAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())