# 快速启动指南

## 前置要求
- Java 17+
- Maven 3.6+
- MySQL 8（本地安装）

## 启动步骤

```bash
# 1. 创建数据库
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS taskdb;
CREATE USER IF NOT EXISTS 'taskuser'@'localhost' IDENTIFIED BY 'taskpass';
GRANT ALL PRIVILEGES ON taskdb.* TO 'taskuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 2. 启动后端
cd backend
mvn spring-boot:run
```

等待启动完成后访问：
- API: http://localhost:8080/api/tasks
- Swagger: http://localhost:8080/swagger-ui.html
- 健康检查: http://localhost:8080/actuator/health

## 验证安装

```bash
# 运行测试
cd backend
mvn test

# 应该看到: Tests run: 10, Failures: 0, Errors: 0
```

## 快速测试 API

```bash
# 创建任务
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试任务",
    "status": "PENDING",
    "priority": "HIGH",
    "tags": ["test"]
  }'

# 查询所有任务
curl http://localhost:8080/api/tasks

# 查询特定任务
curl http://localhost:8080/api/tasks/1
```

## 停止服务

```bash
# Ctrl+C 停止后端
```

## 故障排查

### 端口占用
如果 8080 端口被占用，修改 `application.yml` 中的端口：
```yaml
server:
  port: 8081
```

### 数据库连接失败
1. 确保 MySQL 服务已启动
2. 检查数据库名、用户名、密码是否正确
3. 确认 3306 端口可访问

### Lombok 相关错误
如果编译失败，执行：
```bash
cd backend
mvn clean compile
```

## 下一步

1. 访问 Swagger UI 测试所有 API
2. 查看 `backend/README.md` 了解完整 API 文档
