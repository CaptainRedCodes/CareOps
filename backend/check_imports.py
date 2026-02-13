
try:
    print("Importing app.repositories.base...")
    from app.repositories.base import BaseRepository
    print("Importing app.repositories.booking_repository...")
    from app.repositories.booking_repository import BookingRepository
    print("Importing app.repositories.workspace_repository...")
    from app.repositories.workspace_repository import WorkspaceRepository
    print("Importing app.services.booking_service...")
    from app.services.booking_service import create_booking
    print("Importing app.routers.bookings...")
    from app.routers.bookings import router

    print("SUCCESS: All modules imported correctly.")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
