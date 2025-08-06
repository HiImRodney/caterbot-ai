# 🧪 Kitchen Wizard AI - Testing Guide

## ✅ **Cluster 2: Equipment Selection Complete!**

This guide helps you test the complete Equipment Selection flow that connects to your live Supabase backend.

---

## 🚀 **What's Been Built**

### **Frontend Components (Complete)**
- ✅ **EquipmentGrid** - Main equipment dashboard with live data
- ✅ **EquipmentCard** - Individual equipment display with status
- ✅ **EquipmentSearch** - Advanced filtering and search
- ✅ **QRScanner** - Manual QR entry + test codes
- ✅ **IssueSelectionModal** - Problem categorization
- ✅ **EquipmentContext** - Unified state management

### **Backend Integration (Complete)**  
- ✅ **Supabase Database** - 12 tables with RLS policies
- ✅ **Edge Functions** - 12 deployed functions (7 working, 5 ready)
- ✅ **TOCA Test Data** - 5 equipment items in test kitchen
- ✅ **QR Code System** - Working QR to equipment lookup

---

## 🎯 **Testing Instructions**

### **1. Start the Application**
```bash
# Clone and setup
git clone https://github.com/HiImRodney/kitchen-wizard-ai.git
cd kitchen-wizard-ai

# Install dependencies  
npm install

# Environment is already configured in .env
# Start development server
npm start
```

### **2. Test Equipment Grid**
Visit: `http://localhost:3000/equipment`

**Expected behavior:**
- ✅ Shows "Loading Equipment" spinner initially
- ✅ Displays connection status (green = success, red = error)
- ✅ Shows 5 TOCA equipment items if connected
- ✅ Falls back to sample data if connection fails
- ✅ "Test Connection" button verifies Supabase link

### **3. Test Search & Filtering**
In the equipment grid:

**Search testing:**
- Search "Rational" → should show Main Combi Oven
- Search "Falcon" → should show 2 Falcon items
- Search "Hot Kitchen" → should show equipment in that location

**Filter testing:**
- Status filter → "Maintenance Required" shows dishwasher
- Location filter → "Hot Kitchen" shows cooking equipment
- Clear filters → shows all equipment

### **4. Test QR Code Scanner**

**Click "📱 Scan QR Code" button:**

**Manual Entry Testing:**
- Switch to "⌨️ Manual" tab
- Try these test QR codes:
  - `TOCA-RATIONAL-001` → Main Combi Oven
  - `TOCA-FALCON-001` → 6-Burner Range + Oven  
  - `TOCA-FALCON-002` → Twin Basket Fryer
  - `TOCA-FRIDGE-001` → Pizza Prep Counter
  - `TOCA-DISH-001` → Main Dishwasher (needs maintenance)

**Expected behavior:**
- ✅ Shows "Looking up equipment..." spinner
- ✅ Successfully finds equipment in database
- ✅ Opens Issue Selection Modal with equipment details
- ❌ Invalid QR codes show error message

### **5. Test Issue Selection Modal**

**After scanning valid QR code:**
- ✅ Shows equipment name, location, status
- ✅ Displays categorized issue types:
  - 🔴 **Critical** - Gas leaks, electrical, fire
  - 🟡 **High Priority** - Temperature, heating, mechanical  
  - 🟢 **Medium** - Cleaning, performance, doors
  - 🔵 **Low** - Timers, calibration, efficiency
- ✅ "Start Troubleshooting" button (ready for Cluster 3)

---

## 🔧 **Technical Architecture Verification**

### **Database Connection Test**
```javascript
// In browser console at localhost:3000/equipment
window.supabase.testConnection()
// Should return: "Connected to Supabase successfully"
```

### **Equipment Query Test**
```javascript
// Check equipment data directly
window.supabase.getEquipmentBySite('dfca581b-5590-4845-9b05-8d90f59037c9')
// Should return 5 TOCA equipment items
```

### **QR Scanner API Test**
```javascript
// Test QR scanner Edge Function
window.supabase.scanQRCode('TOCA-RATIONAL-001')
// Should return equipment details with welcome message
```

---

## 📊 **Performance Expectations**

### **Load Times**
- Equipment grid: < 2 seconds
- QR scanner: < 500ms to open
- Database queries: < 1 second
- Image loading: < 500ms

### **Responsiveness**
- ✅ Mobile-first design (phones/tablets)
- ✅ High contrast for kitchen environments  
- ✅ Large touch targets (44px minimum)
- ✅ Works offline with cached data

---

## 🐛 **Troubleshooting**

### **Connection Issues**
If you see "Database connection failed":

1. **Check Environment Variables**
   ```bash
   # Verify .env file exists with:
   REACT_APP_SUPABASE_URL=https://ypmrqzxipboumkjttkmt.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Test Direct Connection**
   - Visit your Supabase dashboard
   - Check if project is active
   - Verify API keys are correct

3. **Check Browser Console**
   - Look for CORS errors
   - Check network tab for failed requests
   - Verify environment variables loaded

### **Missing Equipment**
If equipment grid is empty:

1. **Verify Test Data**
   ```sql
   -- In Supabase SQL Editor
   SELECT COUNT(*) FROM site_equipment 
   WHERE site_id = 'dfca581b-5590-4845-9b05-8d90f59037c9';
   -- Should return 5
   ```

2. **Check RLS Policies**
   - Ensure Row Level Security allows anonymous access
   - Verify site_id matches in queries

### **QR Scanner Issues**
If QR codes don't work:

1. **Check Edge Functions**
   - Visit Supabase Functions dashboard
   - Ensure `qr-scanner` function is deployed
   - Check function logs for errors

2. **Test Manual Entry**
   - Use exact QR codes from testing guide
   - Check for typos in QR code format

---

## 🎉 **Success Criteria**

**✅ Cluster 2 is complete when:**
- Equipment grid loads TOCA data from Supabase
- Search and filtering work correctly
- QR scanner finds equipment by code
- Issue selection modal opens with categories
- Connection testing shows green status
- All components handle errors gracefully

---

## 🚀 **Next Steps: Cluster 3**

**Ready to build when Cluster 2 testing passes:**
- 💬 **Chat Interface** - AI conversation with selected equipment
- 🔧 **Troubleshooting Flow** - Step-by-step guided repairs
- 🤖 **AI Integration** - Live Claude API for complex issues
- 📝 **Response Logging** - Track successful resolutions

**The equipment selection foundation is solid and ready for AI chat integration!**

---

## 📞 **Support**

Having issues? Check:
1. This testing guide for common solutions
2. Browser console for error messages
3. Supabase dashboard for backend status
4. Project knowledge for architecture details

**🎯 Goal: Get to 100% test pass rate before moving to Cluster 3!**