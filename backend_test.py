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

    def test_chat_endpoint(self):
        """Test chatbot endpoint with GPT-5.2"""
        try:
            session_id = f"test-session-{datetime.now().strftime('%H%M%S')}"
            payload = {
                "session_id": session_id,
                "message": "Hello, I need help with AI integration for my business",
                "language": "en"
            }
            response = requests.post(f"{self.base_url}/chat", json=payload, timeout=30)  # Longer timeout for AI
            if response.status_code == 200:
                data = response.json()
                if "response" in data and "session_id" in data and len(data["response"]) > 10:
                    self.log_result("Chat Endpoint", True, f"AI response received: {len(data['response'])} chars")
                    self.test_session_id = session_id  # Store for history test
                    return True
                else:
                    self.log_result("Chat Endpoint", False, "", f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Chat Endpoint", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Chat Endpoint", False, "", f"Exception: {str(e)}")
            return False

    def test_chat_history(self):
        """Test getting chat history"""
        if not hasattr(self, 'test_session_id'):
            self.log_result("Chat History", False, "", "No test session ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/chat/{self.test_session_id}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 2:  # Should have user + assistant message
                    self.log_result("Chat History", True, f"Retrieved {len(data)} messages")
                    return True
                else:
                    self.log_result("Chat History", False, "", f"Expected list with 2+ messages, got: {data}")
                    return False
            else:
                self.log_result("Chat History", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Chat History", False, "", f"Exception: {str(e)}")
            return False

    def test_search_leads(self):
        """Test lead search functionality"""
        if not self.admin_token:
            self.log_result("Search Leads", False, "", "No admin token available")
            return False
        
        # First create a lead to search for
        timestamp = datetime.now().strftime("%H%M%S")
        test_name = f"SearchTest{timestamp}"
        payload = {
            "name": test_name,
            "email": f"search{timestamp}@example.com",
            "company": f"SearchCorp {timestamp}",
            "category": "talent",
            "language": "en"
        }
        
        try:
            # Create test lead
            requests.post(f"{self.base_url}/leads", json=payload, timeout=10)
            
            # Search for it
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/leads?search={test_name}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                found = any(lead.get("name") == test_name for lead in data)
                if found:
                    self.log_result("Search Leads", True, f"Found test lead in search results")
                    return True
                else:
                    self.log_result("Search Leads", False, "", f"Test lead not found in search results: {len(data)} leads")
                    return False
            else:
                self.log_result("Search Leads", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Search Leads", False, "", f"Exception: {str(e)}")
            return False

    def test_status_filter_leads(self):
        """Test lead status filtering"""
        if not self.admin_token:
            self.log_result("Status Filter Leads", False, "", "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/leads?status_filter=new", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Verify all returned leads have 'new' status
                    all_new = all(lead.get("status") == "new" for lead in data)
                    if all_new:
                        self.log_result("Status Filter Leads", True, f"Filtered {len(data)} 'new' leads correctly")
                        return True
                    else:
                        self.log_result("Status Filter Leads", False, "", "Some leads don't have 'new' status")
                        return False
                else:
                    self.log_result("Status Filter Leads", False, "", "Response is not a list")
                    return False
            else:
                self.log_result("Status Filter Leads", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Status Filter Leads", False, "", f"Exception: {str(e)}")
            return False

    def test_csv_export(self):
        """Test CSV export functionality"""
        if not self.admin_token:
            self.log_result("CSV Export", False, "", "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/leads/export", headers=headers, timeout=15)
            
            if response.status_code == 200:
                # Check if response is CSV format
                content_type = response.headers.get('content-type', '')
                if 'csv' in content_type.lower() or 'text/csv' in content_type:
                    content = response.text
                    # Basic CSV validation - should have headers
                    if "Name,Email,Company" in content and len(content) > 50:
                        self.log_result("CSV Export", True, f"CSV exported successfully ({len(content)} chars)")
                        return True
                    else:
                        self.log_result("CSV Export", False, "", f"Invalid CSV content: {content[:100]}")
                        return False
                else:
                    self.log_result("CSV Export", False, "", f"Wrong content type: {content_type}")
                    return False
            else:
                self.log_result("CSV Export", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("CSV Export", False, "", f"Exception: {str(e)}")
            return False

    # ========== Phase 3 Features Tests ==========
    
    def test_chat_analytics(self):
        """Test chat analytics endpoint"""
        if not self.admin_token:
            self.log_result("Chat Analytics", False, "", "No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.base_url}/admin/chat-analytics", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_keys = ["total_sessions", "total_messages", "avg_messages_per_session", "conversations"]
                if all(key in data for key in required_keys):
                    conversations = data.get("conversations", [])
                    self.log_result("Chat Analytics", True, f"Retrieved analytics with {data['total_sessions']} sessions, {len(conversations)} recent conversations")
                    return True
                else:
                    missing = [key for key in required_keys if key not in data]
                    self.log_result("Chat Analytics", False, "", f"Missing keys: {missing}")
                    return False
            else:
                self.log_result("Chat Analytics", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Chat Analytics", False, "", f"Exception: {str(e)}")
            return False
    
    def test_get_case_studies_public(self):
        """Test public case studies endpoint"""
        try:
            response = requests.get(f"{self.base_url}/case-studies", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check that we get seeded case studies
                    if len(data) >= 5:  # Should have at least 5 seeded case studies
                        # Verify case study structure
                        first_case = data[0]
                        required_fields = ["id", "title_fr", "category", "roi", "published"]
                        if all(field in first_case for field in required_fields):
                            self.log_result("Get Case Studies Public", True, f"Retrieved {len(data)} published case studies")
                            self.test_case_study_id = data[0]["id"]  # Store for detail test
                            return True
                        else:
                            missing = [field for field in required_fields if field not in first_case]
                            self.log_result("Get Case Studies Public", False, "", f"Missing fields in case study: {missing}")
                            return False
                    else:
                        self.log_result("Get Case Studies Public", False, "", f"Expected at least 5 case studies, got {len(data)}")
                        return False
                else:
                    self.log_result("Get Case Studies Public", False, "", "Response is not a list")
                    return False
            else:
                self.log_result("Get Case Studies Public", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Case Studies Public", False, "", f"Exception: {str(e)}")
            return False
    
    def test_get_case_study_detail(self):
        """Test single case study detail endpoint"""
        if not hasattr(self, 'test_case_study_id'):
            self.log_result("Get Case Study Detail", False, "", "No test case study ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/case-studies/{self.test_case_study_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "title_fr", "category", "roi", "desc_fr", "challenge_fr", "solution_fr"]
                if all(field in data for field in required_fields):
                    self.log_result("Get Case Study Detail", True, f"Retrieved case study: {data.get('title_fr', 'N/A')}")
                    return True
                else:
                    missing = [field for field in required_fields if field not in data]
                    self.log_result("Get Case Study Detail", False, "", f"Missing fields: {missing}")
                    return False
            else:
                self.log_result("Get Case Study Detail", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Case Study Detail", False, "", f"Exception: {str(e)}")
            return False
    
    def test_create_case_study(self):
        """Test creating a new case study"""
        if not self.admin_token:
            self.log_result("Create Case Study", False, "", "No admin token available")
            return False
        
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            payload = {
                "title_fr": f"Test Case Study {timestamp}",
                "title_en": f"Test Case Study EN {timestamp}",
                "category": "Receipty Talent",
                "roi": "+100% test",
                "desc_fr": f"Description test {timestamp}",
                "desc_en": f"Test description {timestamp}",
                "challenge_fr": "Test challenge description",
                "solution_fr": "Test solution description",
                "results_fr": ["Test result 1", "Test result 2"],
                "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200",
                "tags": ["Test", "API"],
                "tech": ["Test Tech", "API"],
                "published": True
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{self.base_url}/admin/case-studies", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["title_fr"] == payload["title_fr"]:
                    self.test_created_case_id = data["id"]
                    self.log_result("Create Case Study", True, f"Case study created with ID: {self.test_created_case_id}")
                    return True
                else:
                    self.log_result("Create Case Study", False, "", "Missing ID or title mismatch in response")
                    return False
            else:
                self.log_result("Create Case Study", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Case Study", False, "", f"Exception: {str(e)}")
            return False
    
    def test_update_case_study(self):
        """Test updating a case study"""
        if not self.admin_token or not hasattr(self, 'test_created_case_id'):
            self.log_result("Update Case Study", False, "", "Missing admin token or test case study ID")
            return False
        
        try:
            payload = {
                "title_fr": "Updated Test Case Study",
                "roi": "+200% updated",
                "published": False
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{self.base_url}/admin/case-studies/{self.test_created_case_id}", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("title_fr") == payload["title_fr"] and data.get("roi") == payload["roi"]:
                    self.log_result("Update Case Study", True, "Case study updated successfully")
                    return True
                else:
                    self.log_result("Update Case Study", False, "", "Case study not updated correctly")
                    return False
            else:
                self.log_result("Update Case Study", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Case Study", False, "", f"Exception: {str(e)}")
            return False
    
    def test_delete_case_study(self):
        """Test deleting a case study"""
        if not self.admin_token or not hasattr(self, 'test_created_case_id'):
            self.log_result("Delete Case Study", False, "", "Missing admin token or test case study ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(f"{self.base_url}/admin/case-studies/{self.test_created_case_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data.get("message", "").lower():
                    self.log_result("Delete Case Study", True, "Case study deleted successfully")
                    return True
                else:
                    self.log_result("Delete Case Study", False, "", "Unexpected delete response")
                    return False
            else:
                self.log_result("Delete Case Study", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Delete Case Study", False, "", f"Exception: {str(e)}")
            return False
    
    # ========== Phase 5 Features Tests ==========
    
    def test_get_solutions_public(self):
        """Test public solutions endpoint"""
        try:
            response = requests.get(f"{self.base_url}/solutions", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check that we get seeded solutions
                    if len(data) >= 3:  # Should have at least 3 seeded solutions
                        # Verify solution structure
                        first_solution = data[0]
                        required_fields = ["id", "name_fr", "tag_fr", "features_fr", "icon", "published"]
                        if all(field in first_solution for field in required_fields):
                            # Store solutions for later tests
                            self.test_solutions = data
                            self.test_solution_id = data[0]["id"]  # Store for detail test
                            self.log_result("Get Solutions Public", True, f"Retrieved {len(data)} published solutions")
                            return True
                        else:
                            missing = [field for field in required_fields if field not in first_solution]
                            self.log_result("Get Solutions Public", False, "", f"Missing fields in solution: {missing}")
                            return False
                    else:
                        self.log_result("Get Solutions Public", False, "", f"Expected at least 3 solutions, got {len(data)}")
                        return False
                else:
                    self.log_result("Get Solutions Public", False, "", "Response is not a list")
                    return False
            else:
                self.log_result("Get Solutions Public", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Solutions Public", False, "", f"Exception: {str(e)}")
            return False
    
    def test_get_solution_detail(self):
        """Test single solution detail endpoint"""
        if not hasattr(self, 'test_solution_id'):
            self.log_result("Get Solution Detail", False, "", "No test solution ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/solutions/{self.test_solution_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "name_fr", "tag_fr", "features_fr", "icon", "published"]
                if all(field in data for field in required_fields):
                    solution_name = data.get('name_fr', 'N/A')
                    features_count = len(data.get('features_fr', []))
                    self.log_result("Get Solution Detail", True, f"Retrieved solution: {solution_name} with {features_count} features")
                    return True
                else:
                    missing = [field for field in required_fields if field not in data]
                    self.log_result("Get Solution Detail", False, "", f"Missing fields: {missing}")
                    return False
            else:
                self.log_result("Get Solution Detail", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Solution Detail", False, "", f"Exception: {str(e)}")
            return False
    
    def test_create_solution(self):
        """Test creating a new solution"""
        if not self.admin_token:
            self.log_result("Create Solution", False, "", "No admin token available")
            return False
        
        try:
            timestamp = datetime.now().strftime("%H%M%S")
            payload = {
                "name_fr": f"Test Solution {timestamp}",
                "name_en": f"Test Solution EN {timestamp}",
                "tag_fr": "Test Tag",
                "tag_en": "Test Tag EN",
                "desc_fr": f"Description test {timestamp}",
                "desc_en": f"Test description {timestamp}",
                "features_fr": ["Feature Test 1", "Feature Test 2", "Feature Test 3"],
                "features_en": ["Test Feature 1", "Test Feature 2", "Test Feature 3"],
                "icon": "cpu",
                "chart_type": "area",
                "published": True
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{self.base_url}/admin/solutions", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name_fr"] == payload["name_fr"]:
                    self.test_created_solution_id = data["id"]
                    features_count = len(data.get('features_fr', []))
                    self.log_result("Create Solution", True, f"Solution created with ID: {self.test_created_solution_id}, {features_count} features")
                    return True
                else:
                    self.log_result("Create Solution", False, "", "Missing ID or name mismatch in response")
                    return False
            else:
                self.log_result("Create Solution", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Solution", False, "", f"Exception: {str(e)}")
            return False
    
    def test_update_solution(self):
        """Test updating a solution"""
        if not self.admin_token or not hasattr(self, 'test_created_solution_id'):
            self.log_result("Update Solution", False, "", "Missing admin token or test solution ID")
            return False
        
        try:
            payload = {
                "name_fr": "Updated Test Solution",
                "features_fr": ["Updated Feature 1", "Updated Feature 2"],
                "published": False  # Test unpublishing
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{self.base_url}/admin/solutions/{self.test_created_solution_id}", json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name_fr") == payload["name_fr"] and data.get("published") == False:
                    self.log_result("Update Solution", True, "Solution updated and unpublished successfully")
                    return True
                else:
                    self.log_result("Update Solution", False, "", "Solution not updated correctly")
                    return False
            else:
                self.log_result("Update Solution", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Solution", False, "", f"Exception: {str(e)}")
            return False
    
    def test_unpublish_sync(self):
        """Test that unpublished solutions don't appear in public endpoint"""
        try:
            # Get public solutions after unpublishing one
            response = requests.get(f"{self.base_url}/solutions", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Check that our unpublished test solution is not in the list
                if hasattr(self, 'test_created_solution_id'):
                    found_unpublished = any(sol.get("id") == self.test_created_solution_id for sol in data)
                    if not found_unpublished:
                        self.log_result("Unpublish Sync", True, f"Unpublished solution correctly hidden from public API, {len(data)} solutions visible")
                        return True
                    else:
                        self.log_result("Unpublish Sync", False, "", "Unpublished solution still appears in public API")
                        return False
                else:
                    self.log_result("Unpublish Sync", True, f"No test solution to check, {len(data)} solutions visible")
                    return True
            else:
                self.log_result("Unpublish Sync", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Unpublish Sync", False, "", f"Exception: {str(e)}")
            return False
    
    def test_delete_solution(self):
        """Test deleting a solution"""
        if not self.admin_token or not hasattr(self, 'test_created_solution_id'):
            self.log_result("Delete Solution", False, "", "Missing admin token or test solution ID")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(f"{self.base_url}/admin/solutions/{self.test_created_solution_id}", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data.get("message", "").lower():
                    self.log_result("Delete Solution", True, "Solution deleted successfully")
                    return True
                else:
                    self.log_result("Delete Solution", False, "", "Unexpected delete response")
                    return False
            else:
                self.log_result("Delete Solution", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Delete Solution", False, "", f"Exception: {str(e)}")
            return False
    
    def test_lead_with_solution_category(self):
        """Test creating lead with actual solution category name"""
        if not hasattr(self, 'test_solutions') or not self.test_solutions:
            self.log_result("Lead with Solution Category", False, "", "No test solutions available")
            return False
        
        try:
            # Use the first solution from our solutions list
            solution = self.test_solutions[0]
            solution_name = solution.get('name_fr', 'Test Solution')
            
            timestamp = datetime.now().strftime("%H%M%S")
            payload = {
                "name": f"Test User {timestamp}",
                "email": f"test{timestamp}@example.com",
                "company": f"Test Company {timestamp}",
                "phone": "+1234567890",
                "category": solution_name,  # Use actual solution name
                "company_size": 50,
                "features": solution.get('features_fr', [])[:2],  # Use first 2 features
                "estimated_setup": 3000,
                "estimated_monthly": 199,
                "language": "fr"
            }
            response = requests.post(f"{self.base_url}/leads", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["category"] == solution_name:
                    self.log_result("Lead with Solution Category", True, f"Lead created with solution category: {solution_name}")
                    return True
                else:
                    self.log_result("Lead with Solution Category", False, "", "Missing ID or category mismatch in response")
                    return False
            else:
                self.log_result("Lead with Solution Category", False, f"Status: {response.status_code}", f"Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Lead with Solution Category", False, "", f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Receipty Agency API Tests - Phase 3 Features")
        print("=" * 60)
        
        # Basic API connectivity
        self.test_api_root()
        
        # Authentication tests
        self.test_admin_login_invalid()
        self.test_admin_login()
        
        # Lead management tests (MVP)
        self.test_create_lead()
        self.test_get_leads_unauthorized()
        self.test_get_leads_authorized()
        self.test_get_admin_stats()
        self.test_update_lead_status()
        self.test_delete_lead()
        
        # Phase 2 Features
        print("\n🔄 Testing Phase 2 Features:")
        self.test_chat_endpoint()
        self.test_chat_history()
        self.test_search_leads()
        self.test_status_filter_leads()
        self.test_csv_export()
        
        # Phase 3 New Features
        print("\n🆕 Testing Phase 3 Features:")
        self.test_chat_analytics()
        self.test_get_case_studies_public()
        self.test_get_case_study_detail()
        self.test_create_case_study()
        self.test_update_case_study()
        self.test_delete_case_study()
        
        print("=" * 60)
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