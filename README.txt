DameArena Mobile 1.5 – Community Sync (Netlify)

DEPLOYMENT
1. ZIP entpacken und alle Dateien/Ordner ins Root des GitHub-Repositories übernehmen.
2. Netlify muss das Repository als Build-Deployment verwenden (nicht nur manuelles Drag-and-drop statischer Dateien).
3. Build command: npm install; Publish directory: . ; Functions directory: netlify/functions (netlify.toml).
4. Auf Netlify nach dem Deploy die Function community-ingest prüfen.
5. Auf iPhones App neu laden, Version 1.5 kontrollieren.
6. Checkbox Automatische Übertragung freiwillig aktivieren; nach abgeschlossenem Spiel Sync-Status kontrollieren.

DATENSCHUTZ
Keine automatische Übertragung ohne separate Opt-in-Bestätigung. Vorhandene und künftige abgeschlossene Partien werden nach Zustimmung übertragen. Spielername und persönliche Spieler-UUID werden serverseitig durch Whitelist ausgeschlossen. Partie-ID bleibt zur Duplikaterkennung erhalten. Ein Widerruf stoppt zukünftige Übertragungen, löscht bereits gespeicherte Daten nicht. Netlify verarbeitet notwendige technische Verbindungsdaten.

BETRIEBSGRENZEN
Dies ist ein erster Ingest-Prototyp, kein gehärteter öffentlicher Datendienst. Vor breiter Freigabe: Abuse-Schutz/Rate-Limit, Datenlöschprozess, Aufbewahrungsfrist, Datenschutzhinweise, Zugriffskontrolle und Monitoring ergänzen. Keine Behauptung, dass die Übertragung bereits live funktioniert, bevor Netlify erfolgreich deployed und getestet wurde. iOS-PWA synchronisiert nur bei geöffneter App/erneutem Online-Status; kein verlässlicher Hintergrund-Sync. Persönliche Sicherung bleibt erforderlich.
