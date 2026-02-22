"""
Receipty Agency Backend API Tests
Tests for Audit & ROI Module, Authentication, Solutions, Case Studies, Quotes, and Contact APIs
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@receipty.ai"
ADMIN_PASSWORD = "Receipty2024!"


class TestAPIRoot:
    """Test root API endpoint"""
    
    def test_api_root(self):
        """Verify API is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["version"] == "2.0.0"
        print(f"✓ API Root working: {data}")


class TestAuthentication:
    """Authentication endpoint tests - Admin Login with JWT"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["email"] == ADMIN_EMAIL
        assert "role" in data
        print(f"✓ Login successful: {data['email']} (role: {data['role']})")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL
        })
        assert response.status_code == 422
        print("✓ Missing password correctly rejected")


class TestPublicEndpoints:
    """Test public API endpoints (no auth required)"""
    
    def test_solutions_list(self):
        """Test GET /api/solutions - public solutions list"""
        response = requests.get(f"{BASE_URL}/api/solutions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            sol = data[0]
            assert "id" in sol
            assert "name_fr" in sol
            assert "name_en" in sol
            print(f"✓ Solutions API: {len(data)} solutions returned")
        else:
            print("✓ Solutions API working (empty list)")
    
    def test_case_studies_list(self):
        """Test GET /api/case-studies - public case studies list"""
        response = requests.get(f"{BASE_URL}/api/case-studies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            case = data[0]
            assert "id" in case
            assert "title_fr" in case
            print(f"✓ Case Studies API: {len(data)} case studies returned")
        else:
            print("✓ Case Studies API working (empty list)")
    
    def test_site_content(self):
        """Test GET /api/site-content - public site content"""
        response = requests.get(f"{BASE_URL}/api/site-content")
        assert response.status_code == 200
        data = response.json()
        assert "contact" in data or "company" in data or "type" in data
        print(f"✓ Site Content API working")
    
    def test_contact_form_submission(self):
        """Test POST /api/contact - contact form submission"""
        contact_data = {
            "name": "TEST_ContactUser",
            "email": "test.contact@example.com",
            "phone": "+33612345678",
            "subject": "Test Inquiry",
            "message": "This is a test message from automated testing",
            "language": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "message" in data
        print(f"✓ Contact form submission successful")


class TestAuthenticatedEndpoints:
    """Tests requiring admin authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token before each test"""
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
            pytest.skip("Authentication failed")
    
    def test_admin_stats(self):
        """Test GET /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        print(f"✓ Admin stats: {data}")
    
    def test_list_admins(self):
        """Test GET /api/admin/admins"""
        response = requests.get(f"{BASE_URL}/api/admin/admins", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin list: {len(data)} admins")
    
    def test_audit_logs(self):
        """Test GET /api/admin/audit-logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Audit logs: {len(data)} entries")


class TestAuditAndROIModule:
    """Tests for Audit & ROI Optimizer Module with AI generation"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token before each test"""
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
            pytest.skip("Authentication failed")
    
    def test_create_audit_with_ai_generation(self):
        """Test POST /api/admin/audits - Create audit with AI report generation"""
        audit_data = {
            "client_name": "TEST_AuditCompany",
            "client_city": "Strasbourg",
            "client_sector": "Finance",
            "client_email": "test@auditcompany.com",
            "problem_description": "Traitement manuel des factures prenant 15 heures par semaine",
            "hours_lost_per_week": 15,
            "hourly_cost": 45.0,
            "complexity": "medium",
            "notes": "Test audit for automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/audits",
            headers=self.headers,
            json=audit_data,
            timeout=60  # AI generation can take time
        )
        
        assert response.status_code == 200, f"Create audit failed: {response.text}"
        data = response.json()
        
        # Validate audit structure
        assert "id" in data
        assert "audit_number" in data
        assert data["client_name"] == "TEST_AuditCompany"
        assert data["client_sector"] == "Finance"
        
        # Validate ROI calculations
        assert "annual_loss" in data
        assert "annual_savings" in data
        assert "roi_year1" in data
        assert "roi_year2" in data
        assert "hours_after_optimization" in data
        
        # Validate AI-generated content
        assert "ai_report" in data, "AI report should be generated"
        if data["ai_report"]:
            print(f"✓ AI Report generated: {data['ai_report'][:100]}...")
        else:
            print("⚠ AI report is None - AI generation may have failed")
        
        # Validate strategy with closing arguments
        assert "strategy" in data
        strategy = data["strategy"]
        assert "suggested_prices" in strategy
        assert "closing_arguments" in strategy, "Closing arguments should be generated"
        if strategy["closing_arguments"]:
            print(f"✓ Closing arguments generated: {strategy['closing_arguments'][:100]}...")
        else:
            print("⚠ Closing arguments is None")
        
        # Store audit ID for later tests
        self.audit_id = data["id"]
        print(f"✓ Audit created: {data['audit_number']} (ID: {data['id']})")
        return data
    
    def test_list_audits(self):
        """Test GET /api/admin/audits - List all audits"""
        response = requests.get(f"{BASE_URL}/api/admin/audits", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Audits list: {len(data)} audits")
        return data
    
    def test_get_audit_detail(self):
        """Test GET /api/admin/audits/{audit_id} - Get single audit"""
        # First create an audit to get
        audits = self.test_list_audits()
        if len(audits) == 0:
            pytest.skip("No audits available to test")
        
        audit_id = audits[0]["id"]
        response = requests.get(f"{BASE_URL}/api/admin/audits/{audit_id}", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == audit_id
        print(f"✓ Audit detail retrieved: {data['audit_number']}")
    
    def test_audit_pdf_download(self):
        """Test GET /api/admin/audits/{audit_id}/pdf - Download audit PDF"""
        # First get an audit
        audits = self.test_list_audits()
        if len(audits) == 0:
            pytest.skip("No audits available for PDF test")
        
        audit_id = audits[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/admin/audits/{audit_id}/pdf",
            headers=self.headers
        )
        assert response.status_code == 200, f"PDF generation failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000  # PDF should have some content
        print(f"✓ Audit PDF generated: {len(response.content)} bytes")
    
    def test_delete_audit(self):
        """Test DELETE /api/admin/audits/{audit_id} - Delete test audit"""
        # First get test audits
        audits = self.test_list_audits()
        test_audits = [a for a in audits if "TEST_" in a.get("client_name", "")]
        
        for audit in test_audits:
            response = requests.delete(
                f"{BASE_URL}/api/admin/audits/{audit['id']}",
                headers=self.headers
            )
            assert response.status_code == 200
            print(f"✓ Deleted test audit: {audit['audit_number']}")


class TestQuotesPDFGeneration:
    """Tests for Quote PDF generation"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token before each test"""
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
            pytest.skip("Authentication failed")
    
    def test_generate_quote_pdf(self):
        """Test POST /api/admin/quotes/generate - Generate quote PDF"""
        quote_data = {
            "client_name": "TEST_QuoteClient",
            "client_email": "quote.test@example.com",
            "client_company": "Test Quote Company",
            "service_description": "Solution d'automatisation IA pour le traitement des factures",
            "price_ht": 5000.00,
            "notes": "Test quote for automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/quotes/generate",
            headers=self.headers,
            json=quote_data
        )
        
        assert response.status_code == 200, f"Quote generation failed: {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 1000
        print(f"✓ Quote PDF generated: {len(response.content)} bytes")
    
    def test_list_quotes(self):
        """Test GET /api/admin/quotes - List all quotes"""
        response = requests.get(f"{BASE_URL}/api/admin/quotes", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Quotes list: {len(data)} quotes")
        return data
    
    def test_cleanup_test_quotes(self):
        """Delete test quotes"""
        quotes = self.test_list_quotes()
        test_quotes = [q for q in quotes if "TEST_" in q.get("client_name", "")]
        
        for quote in test_quotes:
            response = requests.delete(
                f"{BASE_URL}/api/admin/quotes/{quote['id']}",
                headers=self.headers
            )
            assert response.status_code == 200
            print(f"✓ Deleted test quote: {quote['quote_number']}")


class TestLeadsManagement:
    """Tests for Leads and Contact management"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token before each test"""
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
            pytest.skip("Authentication failed")
    
    def test_create_lead(self):
        """Test POST /api/leads - Create a new lead"""
        lead_data = {
            "name": "TEST_LeadUser",
            "email": "test.lead@example.com",
            "company": "Test Company Inc",
            "phone": "+33612345678",
            "category": "Receipty Talent",
            "company_size": 50,
            "features": ["Tri automatique des CV", "Matching semantique"],
            "estimated_setup": 3000,
            "estimated_monthly": 150,
            "language": "fr"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "test.lead@example.com"
        print(f"✓ Lead created: {data['id']}")
        return data
    
    def test_list_leads(self):
        """Test GET /api/leads - List all leads (admin)"""
        response = requests.get(f"{BASE_URL}/api/leads", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Leads list: {len(data)} leads")
        return data
    
    def test_update_lead_status(self):
        """Test PATCH /api/leads/{lead_id}/status - Update lead status"""
        leads = self.test_list_leads()
        test_leads = [l for l in leads if "TEST_" in l.get("name", "")]
        
        if len(test_leads) == 0:
            pytest.skip("No test leads available")
        
        lead = test_leads[0]
        response = requests.patch(
            f"{BASE_URL}/api/leads/{lead['id']}/status",
            headers=self.headers,
            json={"status": "contacted"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "contacted"
        print(f"✓ Lead status updated to: {data['status']}")
    
    def test_cleanup_test_leads(self):
        """Delete test leads"""
        leads = self.test_list_leads()
        test_leads = [l for l in leads if "TEST_" in l.get("name", "")]
        
        for lead in test_leads:
            response = requests.delete(
                f"{BASE_URL}/api/leads/{lead['id']}",
                headers=self.headers
            )
            assert response.status_code == 200
            print(f"✓ Deleted test lead: {lead['name']}")


class TestSolutionsAPI:
    """Tests for Solutions CRUD operations"""
    
    def test_get_solution_detail(self):
        """Test GET /api/solutions/{sol_id} - Get single solution"""
        # First get list of solutions
        response = requests.get(f"{BASE_URL}/api/solutions")
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No solutions available")
        
        sol_id = response.json()[0]["id"]
        response = requests.get(f"{BASE_URL}/api/solutions/{sol_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sol_id
        print(f"✓ Solution detail: {data.get('name_fr', 'N/A')}")


class TestCaseStudiesAPI:
    """Tests for Case Studies CRUD operations"""
    
    def test_get_case_study_detail(self):
        """Test GET /api/case-studies/{case_id} - Get single case study"""
        # First get list of case studies
        response = requests.get(f"{BASE_URL}/api/case-studies")
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No case studies available")
        
        case_id = response.json()[0]["id"]
        response = requests.get(f"{BASE_URL}/api/case-studies/{case_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == case_id
        print(f"✓ Case study detail: {data.get('title_fr', 'N/A')}")


class TestErrorHandling:
    """Test error handling across endpoints"""
    
    def test_unauthorized_access(self):
        """Test accessing admin endpoints without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("✓ Unauthorized access correctly blocked")
    
    def test_invalid_token(self):
        """Test accessing with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers)
        assert response.status_code == 401
        print("✓ Invalid token correctly rejected")
    
    def test_not_found_audit(self):
        """Test accessing non-existent audit"""
        # Get auth first
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code != 200:
            pytest.skip("Auth failed")
        
        headers = {"Authorization": f"Bearer {login_resp.json()['token']}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/audits/nonexistent-id",
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Non-existent audit correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
