from app import app
from models.ticket import db
from models.member import Member
from sqlalchemy import text

members_data = [
    # Project Manager
    {"full_name": "Võ Đức Quý", "role": "Project Manager", "email": "vdquy4@cmc.com.vn", "phone": "0349689891"},
    
    # System
    {"full_name": "Nguyễn Trung Dũng", "role": "Managed Service Team Leader", "email": "ntrungdung@cmc.com.vn", "phone": "0938099014"},
    {"full_name": "Nguyễn Thành Hiếu", "role": "3rd-line Support Engineer", "email": "ntthanhhieu@cmc.com.vn", "phone": "0943968731"},
    {"full_name": "Phạm Ngọc Thế Bảo", "role": "1st-line Support Engineer", "email": "pntbao@cmc.com.vn", "phone": "0796851287"},
    {"full_name": "Trần Phi Hùng", "role": "1st-line Support Engineer", "email": "tphung@cmc.com.vn", "phone": "0393611155"},
    {"full_name": "Nguyễn Tấn Sang", "role": "1st-line Support Engineer", "email": "ntansang@cmc.com.vn", "phone": "0967600201"},
    {"full_name": "Võ Minh Hoàng", "role": "1st-line Support Engineer", "email": "vminhhoang@cmc.com.vn", "phone": "+84969341494"},
    {"full_name": "Trần Hoàng Điệp", "role": "1st-line Support Engineer", "email": "thdiep@cmc.com.vn", "phone": "0374912816"},
    
    # Network
    {"full_name": "Trần Hồng Đức", "role": "3rd-line Support Engineer", "email": "thongduc@cmc.com.vn", "phone": "0368668379"},
    {"full_name": "Nguyễn Thanh Phú", "role": "1st-line Support Engineer", "email": "ntphu4@cmc.com.vn", "phone": "0941597849"},
    {"full_name": "Nguyễn Văn Kiên", "role": "1st-line Support Engineer", "email": "nvkien@cmc.com.vn", "phone": "0397584511"},
    
    # NOC Team
    {"full_name": "Lê Vĩnh Hiếu", "role": "1st-line Support Engineer", "email": "lvhieu4@cmc.com.vn", "phone": "0394080648"},
    {"full_name": "Lê Tuấn Lương", "role": "1st-line Support Engineer", "email": "ltluong1@cmc.com.vn", "phone": "0909728933"},
    {"full_name": "Trần Thanh Tú", "role": "1st-line Support Engineer", "email": "tranthanhhtu@cmc.com.vn", "phone": "0328206370"},
    {"full_name": "Huỳnh Kỳ Hùng", "role": "1st-line Support Engineer", "email": "hkhung@cmc.com.vn", "phone": "0901484659"},
    {"full_name": "Lê Duy Khang", "role": "1st-line Support Engineer", "email": "ldkhang@cmc.com.vn", "phone": "0393469135"},
    {"full_name": "Ngô Nhật An", "role": "1st-line Support Engineer", "email": "nnhatan@cmc.com.vn", "phone": "0932772850"},
    {"full_name": "Nguyễn Hoàng Hiệu", "role": "1st-line Support Engineer", "email": "nhhieu5@cmc.com.vn", "phone": "0962551764"},
    {"full_name": "Chung Ngọc Lân", "role": "1st-line Support Engineer", "email": "cnlan2@cmc.com.vn", "phone": "0929303458"},
    {"full_name": "Hà Anh Tú", "role": "1st-line Support Engineer", "email": "hatu2@cmc.com.vn", "phone": "0901264400"},
]

def seed_members():
    with app.app_context():
        # Check if role column exists, if not add it
        with db.engine.connect() as conn:
            try:
                # SQLite specific check
                result = conn.execute(text("PRAGMA table_info(members)")).fetchall()
                columns = [row[1] for row in result]
                if 'role' not in columns:
                    print("Adding 'role' column to members table...")
                    conn.execute(text("ALTER TABLE members ADD COLUMN role VARCHAR(100)"))
                    conn.commit()
            except Exception as e:
                print(f"Error checking/adding column: {e}")
                # For non-sqlite or other errors, might fail but let's try to proceed
        
        print("Seeding members...")
        added = 0
        updated = 0
        for data in members_data:
            member = Member.query.filter_by(email=data['email']).first()
            if member:
                member.full_name = data['full_name']
                member.role = data['role']
                member.phone = data['phone']
                member.project = 'CMC' # Start with CMC project
                updated += 1
            else:
                member = Member(
                    full_name=data['full_name'],
                    email=data['email'],
                    role=data['role'],
                    phone=data['phone'],
                    project='CMC'
                )
                db.session.add(member)
                added += 1
        
        db.session.commit()
        print(f"Done. Added {added} members, updated {updated} members.")

if __name__ == "__main__":
    seed_members()
