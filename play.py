"""A tiny launcher; both prototypes remain independent."""


def main():
    while True:
        print("\nTWO FIELD TESTS\n")
        print("[1] IDLISSEUS  — Five stops through an uncertain AI landscape.")
        print("[2] FIELDWORK  — Pick a place in India. Clear one service bottleneck.")
        print("[Q] Quit. Inside either game, Q returns here.\n")
        try:
            choice = input("> ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if choice in ("q", "quit", "exit"):
            return 0
        if choice == "1":
            from idlisseus.__main__ import main as run
        elif choice == "2":
            from fieldwork.__main__ import main as run
        else:
            continue
        run([])


if __name__ == "__main__":
    raise SystemExit(main())
