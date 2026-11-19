DameArena Mobile 1.3 – Dateisicherung und Zusammenführen

Alle abgeschlossenen Partien stehen in EINER persönlichen JSON-Sicherung unter games; die laufende Partie unter current_game.
Auf iOS öffnet „In Dateien sichern“ nach Möglichkeit das Teilen-Menü, dort „In Dateien sichern“ wählen. Alternativ Download in Safari und Datei manuell nach iCloud Drive oder Auf meinem iPhone verschieben.
„Partien zusammenführen“ importiert abgeschlossene Partien derselben Spieler-UUID, überspringt vorhandene game_id und erhält laufende Partie sowie Profil.
„Sicherung wiederherstellen (ersetzen)“ ersetzt weiterhin die gesamte lokale Datenbank – vorher exportieren!
Community-Export ohne Anzeigenamen und persönliche Spieler-UUID; freiwillig und manuell.
Die App kann auf iOS keine Hintergrunddatei automatisch überschreiben.

Deployment: Dateien aus dem ZIP im GitHub-Repository-Root ersetzen, committen.
