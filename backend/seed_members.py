from app import app
from models.ticket import db
from models.member import Member

def seed_members():
    members_data = [
        {
            "email": "nguyen@example.com",
            "full_name": "Nguyen Van A",
            "role": "Developer",
            "birth_year": 1990,
            "cccd": "123456789012",
            "phone": "0901234567",
            "project": "ITSM Dashboard"
        },
        {
            "email": "tran@example.com",
            "full_name": "Tran Thi B",
            "role": "Designer",
            "birth_year": 1995,
            "cccd": "987654321098",
            "phone": "0909876543",
            "project": "ITSM Dashboard"
        },
        {
            "email": "le@example.com",
            "full_name": "Le Van C",
            "role": "Project Manager",
            "birth_year": 1985,
            "cccd": "112233445566",
            "phone": "0901112233",
            "project": "Cloud Migration"
        }
    ]

    with app.app_context():
        print("Seeding members...")
        for data in members_data:
            existing = Member.query.filter_by(email=data['email']).first()
            if not existing:
                member = Member(
                    email=data['email'],
                    full_name=data['full_name'],
                    role=data['role'],
                    birth_year=data['birth_year'],
                    cccd=data['cccd'],
                    phone=data['phone'],
                    project=data['project']
                )
                db.session.add(member)
                print(f"Added member: {data['full_name']}")
            else:
                print(f"Member already exists: {data['full_name']}")
        
        db.session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    seed_members()
