chat_bot_dashboard/
├── backend/
│   ├── __init__.py
│   ├── main.py           # 应用入口，初始化 FastAPI
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py     # 配置文件 (数据库连接, 密钥)
│   ├── models/
│   │   ├── __init__.py
│   │   └── ...     # SQLAlchemy 或其他 ORM 模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── ...      # Pydantic 模型 (数据验证)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── ...     
│   │   └── ...      
│   └── dependencies.py   # 全局依赖项 (如 OAuth2)
├── tests/                # 测试用例
├── requirements.txt      # 依赖包
└── .env                  # 环境变量
