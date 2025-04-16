from setuptools import setup, find_packages

setup(
    name="neo-future-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "websockets",
        "python-dotenv",
        "aiohttp",
        "pydantic",
        "python-multipart",
    ],
) 