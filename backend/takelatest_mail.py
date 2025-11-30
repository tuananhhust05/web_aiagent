import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr
import json
# ---- CẤU HÌNH ----
IMAP_SERVER = "imap.gmail.com"   # Gmail
EMAIL_USER = "4skale.marketing@gmail.com"
APP_PASSWORD = "zgco rdxp kaul pjyf"

def decode_text(raw):
    if raw is None:
        return ""
    decoded, enc = decode_header(raw)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(enc if enc else "utf-8", errors="ignore")
    return decoded

def get_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode("utf-8", errors="ignore")
    else:
        return msg.get_payload(decode=True).decode("utf-8", errors="ignore")
    return ""

mail = imaplib.IMAP4_SSL(IMAP_SERVER)
mail.login(EMAIL_USER, APP_PASSWORD)
mail.select("INBOX")

result, data = mail.search(None, "ALL")
mail_ids = data[0].split()
latest_5 = mail_ids[-5:]

emails = []

for i in latest_5[::-1]:
    _, msg_data = mail.fetch(i, "(RFC822)")
    msg = email.message_from_bytes(msg_data[0][1])

    # Lấy email (không lấy tên)
    raw_from = msg.get("From")
    _, email_addr = parseaddr(raw_from)

    subject = decode_text(msg.get("Subject"))
    body = get_body(msg)

    emails.append({
        "from": email_addr,   # <<<<< email thật
        "subject": subject,
        "body": body.strip()
    })

print(json.dumps(emails, indent=4, ensure_ascii=False))