# 🎫 VOUCHER API USAGE GUIDE

## 🔧 **Fixed Issues & Latest Updates**

### ❌ **Previous Error:**

```
ERROR [VoucherService] Lỗi khi lưu voucher: ER_NO_REFERENCED_ROW_2: Cannot add or update a child row: a foreign key constraint fails (`nest_base1`.`vouchers`, CONSTRAINT `FK_5aab221bf16e6fb2e22689f4f88` FOREIGN KEY (`campaignId`) REFERENCES `voucher_campaigns` (`id`) ON DELETE SET NULL ON UPDATE CASCADE)
```

### ✅ **Solution Applied:**

1. **CampaignId Validation:** Thêm validation để kiểm tra campaignId trước khi lưu
2. **Null Handling:** Set campaignId = null khi không sử dụng campaign
3. **User-Friendly Error:** Thông báo rõ ràng khi user cố gắng dùng tính năng chưa có
4. **Future-Proof:** Code sẵn sàng cho việc implement VoucherCampaign sau

### 🆕 **Latest Update: Relationship Tables (v2.0)**

**Date:** October 3, 2025

#### **🔄 Architecture Change:**

- **OLD:** JSON arrays `receiverIds` và `voucher_productIds` trong `vouchers` table
- **NEW:** Proper relationship tables `voucher-recipient` và `voucher_products`

#### **✅ Benefits:**

1. **Better Performance:** Indexed foreign keys thay vì JSON queries
2. **Data Integrity:** Foreign key constraints đảm bảo consistency
3. **Scalability:** Dễ dàng query và join với user/product data
4. **Audit Trail:** Thêm được metadata cho từng relationship
5. **Flexible:** Hỗ trợ complex queries và analytics

#### **🔧 Transaction-Safe Creation:**

- **Database Transactions:** Đảm bảo data consistency với QueryRunner
- **Rollback Support:** Automatic rollback nếu có lỗi trong quá trình tạo
- **Atomic Operations:** Tất cả records được tạo trong 1 transaction

---

## 🛠️ **TROUBLESHOOTING GUIDE**

### 🐛 **Common Issues & Solutions**

#### **1. VoucherProduct Records Not Being Saved**

**Symptoms:**

- VoucherRecipient records are created successfully
- VoucherProduct records are missing in database
- No error messages in logs

**Debugging Steps:**

1. **Check Column Names:**

   ```sql
   -- Verify table structure
   DESCRIBE voucher_products;

   -- Expected columns: id, voucherId, productId, createdAt
   ```

2. **Enable Debug Logging:**

   ```typescript
   // In voucher.service.ts
   console.log('ProductIds to save:', productIds);
   console.log('VoucherProduct entities:', voucherProductEntities);
   ```

3. **Raw SQL Fallback:**
   ```sql
   -- Manual insert for testing
   INSERT INTO voucher_products (voucherId, productId, createdAt)
   VALUES (1, 1, NOW());
   ```

**Solutions:**

- ✅ **Fixed:** Added explicit `@JoinColumn` decorators in `VoucherProductEntity`
- ✅ **Implemented:** Dual-approach creation (Raw SQL + Entity fallback)
- ✅ **Added:** Comprehensive logging for debugging

#### **2. Foreign Key Constraint Errors**

**Solution:** Always validate referenced entities exist before creation:

```typescript
// Validate users exist
const existingUsers = await this.usersRepository.find({
  where: { id: In(receiverIds) },
});

// Validate products exist
const existingProducts = await this.productsRepository.find({
  where: { id: In(productIds) },
});
```

#### **3. Transaction Rollback Issues**

**Prevention:**

- Always use `QueryRunner` for multi-table operations
- Proper error handling with try-catch-finally
- Explicit commit/rollback calls

```typescript
const queryRunner = this.dataSource.createQueryRunner();
try {
  await queryRunner.startTransaction();
  // ... operations
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### 📊 **Database Validation Queries**

```sql
-- Check voucher with relationships
SELECT
    v.id,
    v.voucherName,
    COUNT(DISTINCT vr.userId) as recipient_count,
    COUNT(DISTINCT vp.productId) as product_count
FROM vouchers v
LEFT JOIN `voucher-recipient` vr ON v.id = vr.voucherId
LEFT JOIN voucher_products vp ON v.id = vp.voucherId
WHERE v.id = YOUR_VOUCHER_ID
GROUP BY v.id;

-- Verify relationship data
SELECT * FROM `voucher-recipient` WHERE voucherId = YOUR_VOUCHER_ID;
SELECT * FROM voucher_products WHERE voucherId = YOUR_VOUCHER_ID;
```

---

## 📋 **API Endpoints**

### **Base URL:** `http://localhost:3000/api/v1/vouchers`

### **1. 🆕 Tạo Voucher**

```http
POST /api/v1/vouchers
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER2024",
  "value_discount": 20,
  "discount_type": "PERCENTAGE",
  "description": "Khuyến mãi mùa hè",
  "targetReceiverGroup": 4,
  "targetType": "0",
  "validFrom": "2024-11-01T00:00:00Z",
  "validTo": "2024-11-30T23:59:59Z",
  "min_order_value": 100000,
  "max_discount_value": 50000,
  "usage_limit": 1000,
  "per_user_limit": 2,
  "isActive": true,
  "isPublic": false
}
```

**⚠️ Important Notes:**

- **DON'T** include `campaignId` in request (sẽ báo lỗi)
- **targetType:** "0"=ALL, "1"=BRAND, "2"=CATEGORY, "3"=PRODUCT
- **targetReceiverGroup:** Numeric enum values

### **2. 📋 Lấy Danh Sách Voucher**

```http
GET /api/v1/vouchers?limit=20
Authorization: Bearer <token>
```

### **3. 🔍 Lấy Voucher Theo ID**

```http
GET /api/v1/vouchers/1
Authorization: Bearer <token>
```

### **4. 🔎 Tìm Voucher Theo Code**

```http
GET /api/v1/vouchers/code/SUMMER2024
Authorization: Bearer <token>
```

### **5. 🗑️ Vô Hiệu Hóa Voucher**

```http
DELETE /api/v1/vouchers/1
Authorization: Bearer <token>
```

---

## 🎯 **Sample Requests**

### **Percentage Discount Voucher:**

```json
{
  "code": "SALE20",
  "value_discount": 20,
  "discount_type": "PERCENTAGE",
  "description": "Giảm 20% toàn bộ đơn hàng",
  "targetReceiverGroup": 4,
  "targetType": "0",
  "validFrom": "2024-11-01T00:00:00Z",
  "validTo": "2024-12-31T23:59:59Z",
  "min_order_value": 500000,
  "max_discount_value": 100000,
  "usage_limit": 500,
  "per_user_limit": 1,
  "isActive": true,
  "isPublic": false
}
```

### **Fixed Amount Discount Voucher:**

```json
{
  "code": "FIXED50K",
  "value_discount": 50000,
  "discount_type": "AMOUNT",
  "description": "Giảm 50,000 VND",
  "targetReceiverGroup": 4,
  "targetType": "0",
  "validFrom": "2024-11-01T00:00:00Z",
  "validTo": "2024-11-30T23:59:59Z",
  "min_order_value": 200000,
  "usage_limit": 100,
  "per_user_limit": 1,
  "isActive": true,
  "isPublic": true
}
```

### **Brand-Specific Voucher:**

```json
{
  "code": "APPLE15",
  "value_discount": 15,
  "discount_type": "PERCENTAGE",
  "description": "Giảm 15% sản phẩm Apple",
  "targetReceiverGroup": 4,
  "targetType": "1",
  "voucher_productIds": [1, 2, 3],
  "validFrom": "2024-11-01T00:00:00Z",
  "validTo": "2024-11-30T23:59:59Z",
  "min_order_value": 1000000,
  "max_discount_value": 200000,
  "usage_limit": 200,
  "per_user_limit": 1,
  "isActive": true,
  "isPublic": false
}
```

---

## 🚨 **Error Handling**

### **Common Errors:**

1. **Campaign Not Supported:**

```json
{
  "success": false,
  "message": "Tính năng Campaign chưa được triển khai. Vui lòng tạo voucher không liên kết campaign (bỏ trống campaignId)"
}
```

2. **Duplicate Code:**

```json
{
  "success": false,
  "message": "Mã voucher \"SUMMER2024\" đã tồn tại. Vui lòng sử dụng mã khác."
}
```

3. **Invalid Date Range:**

```json
{
  "success": false,
  "message": "Thời gian kết thúc phải sau thời gian bắt đầu"
}
```

4. **Permission Denied:**

```json
{
  "success": false,
  "message": "Bạn không có quyền tạo voucher"
}
```

---

## 🔑 **Authentication & Authorization**

### **Required Roles:**

- **Create/Delete:** `ADMINISTRATOR`, `HUMAN_RESOURCES`
- **Read:** `ADMINISTRATOR`, `HUMAN_RESOURCES`, `EMPLOYEE`

### **Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📊 **Field Descriptions**

| Field                 | Type     | Required | Description                                   | Example                |
| --------------------- | -------- | -------- | --------------------------------------------- | ---------------------- |
| `code`                | string   | ✅       | Mã voucher duy nhất (max 100 chars)           | "SUMMER2024"           |
| `value_discount`      | number   | ✅       | Giá trị giảm (% hoặc VND)                     | 20                     |
| `discount_type`       | enum     | ✅       | "PERCENTAGE" hoặc "AMOUNT"                    | "PERCENTAGE"           |
| `description`         | string   | ❌       | Mô tả voucher                                 | "Khuyến mãi mùa hè"    |
| `targetReceiverGroup` | number   | ❌       | Nhóm người nhận (0-5)                         | 4                      |
| `targetType`          | enum     | ✅       | "0"=ALL, "1"=BRAND, "2"=CATEGORY, "3"=PRODUCT | "0"                    |
| `validFrom`           | datetime | ✅       | Thời gian bắt đầu                             | "2024-11-01T00:00:00Z" |
| `validTo`             | datetime | ✅       | Thời gian kết thúc                            | "2024-11-30T23:59:59Z" |
| `min_order_value`     | number   | ❌       | Giá trị đơn hàng tối thiểu                    | 100000                 |
| `max_discount_value`  | number   | ❌       | Giá trị giảm tối đa                           | 50000                  |
| `usage_limit`         | number   | ❌       | Giới hạn tổng số lần dùng                     | 1000                   |
| `per_user_limit`      | number   | ❌       | Giới hạn mỗi user (default: 1)                | 2                      |
| `isActive`            | boolean  | ❌       | Trạng thái kích hoạt (default: true)          | true                   |
| `isPublic`            | boolean  | ❌       | Public voucher (default: false)               | false                  |
| `voucher_productIds`  | number[] | ❌       | IDs sản phẩm áp dụng (khi targetType != "0")  | [1,2,3]                |

---

## 🚀 **Success Responses**

### **Create Voucher Success:**

```json
{
  "success": true,
  "message": "Voucher đã được tạo thành công",
  "data": {
    "id": 1,
    "code": "SUMMER2024",
    "value_discount": 20,
    "discount_type": "PERCENTAGE",
    "description": "Khuyến mãi mùa hè",
    "targetReceiverGroup": 4,
    "targetType": "0",
    "validFrom": "2024-11-01T00:00:00.000Z",
    "validTo": "2024-11-30T23:59:59.000Z",
    "min_order_value": 100000,
    "max_discount_value": 50000,
    "usage_limit": 1000,
    "used_count": 0,
    "per_user_limit": 2,
    "status": "ACTIVE",
    "isActive": true,
    "isPublic": false,
    "campaignId": null,
    "receiverIds": [1, 2, 3, 4, 5],
    "voucher_productIds": [],
    "createdAt": "2024-11-01T12:00:00.000Z",
    "updatedAt": "2024-11-01T12:00:00.000Z"
  }
}
```

---

## 📝 **Development Notes**

### **TODO - Future Features:**

1. **VoucherCampaign Integration:**
   - Add VoucherCampaign repository to module
   - Implement campaign validation
   - Enable campaignId field

2. **User Endpoints:**
   - GET `/public` - Public vouchers
   - GET `/validate/:code` - Validate voucher
   - GET `/my-vouchers` - User's vouchers
   - POST `/claim/:code` - Claim public voucher

3. **Analytics Endpoints:**
   - GET `/analytics/stats` - Voucher statistics
   - GET `/analytics/top-used` - Most used vouchers

### **Current Limitations:**

- Campaign feature disabled (foreign key constraint)
- No user-facing endpoints yet
- No analytics/reporting features

---

## 🎉 **Status: READY FOR PRODUCTION**

✅ **Core Features Working:**

- Create voucher with full validation
- List, get by ID, get by code
- Soft delete functionality
- Complete error handling
- Role-based authentication

✅ **Production Ready:**

- Comprehensive logging
- Input validation
- Error handling
- API documentation
- Type safety
