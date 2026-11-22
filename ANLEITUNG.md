# Fit mit Herz – Anleitung

## 1. Was die App kann

- **Start:** Begrüßung, Gedanke des Tages, heutiges Training (30 Min) mit großem Start-Knopf, aktuelles Gewicht, verbleibende Kilo, Trainingsserie, Wochenübersicht, schnelle Büropausen.
- **Training:** Wochenplan (Mo–So), jedes Tagestraining mit 5 Min Aufwärmen · 20 Min Haupttraining · 5 Min Dehnen. Übungen einzeln starten oder abhaken.
- **Trainings-Modus:** animierte Figur, Timer, Signaltöne und Sprachansage, Pause, Zurück, Erledigt, Weiter, Seitenwechsel-Hinweis, leichtere Variante, Anleitung, vorzeitig beenden und der rote Knopf **„Schmerzen, Schwindel oder Taubheit? – Hier stoppen“**.
- **Beweglich:** Rücken- und Nackenprogramm (15 Min), Yoga für Einsteigerinnen (15 Min), Hüfte & Beine mobil (10 Min), 5 Büropausen (3–5 Min), alle 76 Übungen zum Nachschlagen.
- **Fortschritt:** Gewicht und Bauchumfang eintragen, Diagramme mit gesundem Bereich (0,25–0,5 kg pro Woche), Wochenauswertung, BMI, Kalorienschätzung.
- **Motivation:** Trainingsserie, Wochenstatistik, persönliche Erfolge, 22 Meilensteine.
- **Einstellungen (Zahnrad oben rechts):** Profil, Trainingsstufe, Töne/Sprache/Vibration, leichtere Varianten, Sicherung speichern und laden, Excel-Tabellen.

## 2. So funktioniert das Training

- **Abwechslung:** Es gibt 4 Wochenvarianten (A, B, C, D), die sich automatisch abwechseln.
- **Steigerung in 3 Stufen:** Ankommen → Aufbauen → Festigen. Nach jedem Training fragt die App „zu leicht / genau richtig / zu schwer“. Nach 4 Wochen und mindestens 12 Trainings auf einer Stufe schlägt sie die nächste Stufe vor – aber nur, wenn es sich gut anfühlt. Ist es öfter zu schwer, schlägt sie eine Stufe zurück vor.
- **Jede Übung** hat Animation, Anleitung, richtige Haltung, Dauer/Wiederholungen, Schwierigkeit, häufige Fehler, trainierte Muskeln und eine leichtere Variante.
- **Hilfsmittel:** eine Matte (oder ein Teppich), ein stabiler Stuhl ohne Rollen, eine freie Wand. Für einige Kraftübungen optional zwei Wasserflaschen.

## 3. Deine Daten

- Alles wird **nur auf deinem Gerät** gespeichert. Kein Konto, keine Cloud, keine Kosten.
- Handy und PC haben **getrennte Daten**. Übertragen: Einstellungen → **„Sicherung speichern (.json)“**, die Datei auf das andere Gerät schicken (z. B. per E-Mail oder Google Drive) und dort **„Sicherung laden“** wählen.
- Mach etwa **einmal im Monat eine Sicherung**.
- **Wichtig:** Wenn du im Browser „Browserdaten löschen“ wählst oder die App deinstallierst, sind die Daten weg – außer du hast eine Sicherung.

## 4. Installation auf dem Android-Handy

> Voraussetzung: Die App ist im Internet bereitgestellt (z. B. über GitHub Pages). Diesen Schritt erledigen wir gemeinsam – du bekommst dann eine Internetadresse.

1. Öffne die Adresse der App in **Chrome** auf deinem Handy.
2. Tippe oben rechts auf die **drei Punkte ⋮**.
3. Tippe auf **„App installieren“** (manchmal heißt es **„Zum Startbildschirm hinzufügen“**).
4. Bestätige mit **„Installieren“**.
5. Auf deinem Startbildschirm erscheint jetzt das Herz-Symbol **„Fit mit Herz“**. Ab jetzt öffnest du die App immer darüber.
6. Beim ersten Start gibst du deinen Namen ein, prüfst dein Profil und beantwortest den Gesundheits-Check.

Die App funktioniert danach **auch ohne Internet**.

## 5. Installation auf dem Windows-PC

1. Öffne die Adresse der App in **Chrome** oder **Microsoft Edge**.
2. Klicke rechts in der Adresszeile auf das kleine **Bildschirm-Symbol mit Pfeil** („App installieren“) – oder im Menü ⋮ auf **„Fit mit Herz installieren“**.
3. Klicke auf **„Installieren“**. Die App erscheint im Startmenü und kann an die Taskleiste angeheftet werden.

## 6. App auf dem PC lokal starten (ohne Internet-Bereitstellung)

Im Ordner `Fit-mit-Herz` in PowerShell:

```powershell
node tools/server.js
```

Dann im Browser `http://localhost:4173` öffnen. (Nur auf diesem PC – das Handy kann diese Adresse nicht öffnen.)

## 7. Tipps für den Alltag

- Trainiere möglichst **zur gleichen Uhrzeit** – so wird es zur Gewohnheit.
- **Wiege dich einmal pro Woche**, morgens nach dem Aufstehen.
- Mach am PC **alle 1–2 Stunden eine Büropause** (3–5 Min).
- An müden Tagen: lieber **die leichte Variante oder Yoga** als gar nichts.

## 8. Sicherheit

- Nur im **schmerzfreien Bereich** üben. Bei Schmerzen, Schwindel, Taubheit, Kribbeln, Übelkeit oder Atemnot **sofort aufhören**.
- Bei Brustschmerz, Druck in der Brust, starker Atemnot, Lähmung oder Sprachstörung: **112**.
- Bei bestehenden Beschwerden vor dem Start **ärztlich abklären** lassen.
- Die App ersetzt **keine ärztliche oder physiotherapeutische Behandlung**.

## 9. Für Entwicklung und Wartung

- Automatische Prüfung: `node tests/check.mjs` (prüft alle Übungen, alle 84 Tagespläne, Programme, Kalorien).
- Figuren-Prüfseite: `http://localhost:4173/tools/figures.html`.
- Nach jeder Änderung die Versionsnummer in `sw.js` erhöhen, damit Handys das Update laden.
- Aufbau: `index.html`, `css/app.css`, `js/` (app, store, exercises, plans, figures, trainer, progress, charts, ui), `sw.js`, `manifest.webmanifest`, `icons/`.
