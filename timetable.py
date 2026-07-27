# Simple Weekly Timetable Maker
# For beginners learning Python

DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

# timetable[day] = list of classes
# each class is a dictionary with course_code, course_name, start_time, end_time
timetable = {
    "Monday": [],
    "Tuesday": [],
    "Wednesday": [],
    "Thursday": [],
    "Friday": [],
    "Saturday": [],
    "Sunday": [],
}


def show_help():
    """Show all available commands with explanations."""
    print()
    print("=" * 50)
    print("  TIMETABLE MAKER - COMMANDS")
    print("=" * 50)
    print("  help              - Show this list of commands")
    print("  show              - Show the full weekly timetable")
    print("  show <day>        - Show classes for one day")
    print("                      Example: show Monday")
    print("  add               - Add a new class (asks for details)")
    print("  remove            - Remove a class (asks for details)")
    print("  clear             - Remove all classes from one day")
    print("  quit              - Exit the program")
    print("=" * 50)
    print()


def show_day(day):
    """Print all classes for one day."""
    classes = timetable[day]

    print()
    print(f"--- {day} ---")

    if len(classes) == 0:
        print("  (no classes)")
        return

    for index, class_info in enumerate(classes, start=1):
        code = class_info["course_code"]
        name = class_info["course_name"]
        start = class_info["start_time"]
        end = class_info["end_time"]
        print(f"  {index}. [{code}] {name}  |  {start} - {end}")


def show_all():
    """Print the full weekly timetable."""
    print()
    print("=" * 50)
    print("  YOUR WEEKLY TIMETABLE")
    print("=" * 50)

    for day in DAYS:
        show_day(day)

    print()


def ask_for_day():
    """Ask the user for a day name. Returns the day, or None if invalid."""
    print()
    print("Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday")
    day = input("Enter the day: ").strip().title()

    if day not in DAYS:
        print(f"Sorry, '{day}' is not a valid day. Try again.")
        return None

    return day


def add_class():
    """Ask for class details and add it to the timetable."""
    print()
    print("--- ADD A CLASS ---")

    day = ask_for_day()
    if day is None:
        return

    course_code = input("Enter course code (example: CSE101): ").strip()
    course_name = input("Enter course name (example: Intro to Programming): ").strip()
    start_time = input("Enter start time (example: 09:00): ").strip()
    end_time = input("Enter end time (example: 10:30): ").strip()

    if course_code == "" or course_name == "" or start_time == "" or end_time == "":
        print("All fields are required. Class was not added.")
        return

    new_class = {
        "course_code": course_code,
        "course_name": course_name,
        "start_time": start_time,
        "end_time": end_time,
    }

    timetable[day].append(new_class)
    print(f"Added [{course_code}] {course_name} on {day} ({start_time} - {end_time}).")


def remove_class():
    """Show classes for a day and remove the one the user picks."""
    print()
    print("--- REMOVE A CLASS ---")

    day = ask_for_day()
    if day is None:
        return

    classes = timetable[day]

    if len(classes) == 0:
        print(f"There are no classes on {day} to remove.")
        return

    show_day(day)
    print()

    number_text = input("Enter the number of the class to remove: ").strip()

    if not number_text.isdigit():
        print("Please enter a number, like 1 or 2.")
        return

    number = int(number_text)

    if number < 1 or number > len(classes):
        print(f"Please choose a number between 1 and {len(classes)}.")
        return

    removed = classes.pop(number - 1)
    code = removed["course_code"]
    name = removed["course_name"]
    print(f"Removed [{code}] {name} from {day}.")


def clear_day():
    """Remove all classes from one day."""
    print()
    print("--- CLEAR A DAY ---")

    day = ask_for_day()
    if day is None:
        return

    count = len(timetable[day])

    if count == 0:
        print(f"{day} already has no classes.")
        return

    confirm = input(f"Remove all {count} class(es) from {day}? (yes/no): ").strip().lower()

    if confirm == "yes":
        timetable[day] = []
        print(f"Cleared all classes from {day}.")
    else:
        print("Cancelled. Nothing was removed.")


def main():
    """Main loop: read commands and run them."""
    print()
    print("Welcome to the Weekly Timetable Maker!")
    print("Type 'help' to see all commands.")

    while True:
        print()
        command = input("Command > ").strip().lower()

        if command == "":
            continue

        if command == "help":
            show_help()

        elif command == "show":
            show_all()

        elif command.startswith("show "):
            day = command[5:].strip().title()
            if day in DAYS:
                show_day(day)
                print()
            else:
                print(f"Sorry, '{day}' is not a valid day.")
                print("Try: show Monday")

        elif command == "add":
            add_class()

        elif command == "remove":
            remove_class()

        elif command == "clear":
            clear_day()

        elif command == "quit" or command == "exit":
            print("Goodbye! See you next semester.")
            break

        else:
            print(f"Unknown command: '{command}'")
            print("Type 'help' to see the list of commands.")


# This runs main() when you start the file with: python timetable.py
if __name__ == "__main__":
    main()
