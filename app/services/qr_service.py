from pathlib import Path
import qrcode

QR_DIR = Path("uploads/qrcodes")
QR_DIR.mkdir(parents=True, exist_ok=True)


def generate_qr(asset_id: str) -> str:
    file_path = QR_DIR / f"{asset_id}.png"

    img = qrcode.make(asset_id)
    img.save(file_path)

    return str(file_path)