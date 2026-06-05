from app.services.qr_service import generate_qr

path = generate_qr("AST-0001")

print(path)