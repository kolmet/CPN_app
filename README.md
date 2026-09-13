# Cooperativa · Reserves

App de reserves per a la cooperativa d'habitatges: bugaderia (rentadores
numerades, per zona, amb temps de rentat curt/llarg reals) i habitacions
d'hostes, amb identitat per correu (diversos correus per porta) i avisos al
mòbil quan una bugada acaba.

## Estructura del projecte

```
src/
  config.js            Plantes/zones, franja horària (8:00-22:00), colors
  identity.js          "Qui ets" es recorda al navegador (localStorage)
  supabaseClient.js     Client de Supabase + funcions per a cada taula
  push.js               Subscripció a notificacions push
  App.jsx                Pantalla principal i pestanyes
  components/
    Onboarding.jsx       Alta: correu -> porta -> zona (si cal)
    Settings.jsx          Afegir correus, activar notificacions
    LaundryTab.jsx         Reserva de rentadores
    RoomsTab.jsx            Reserva d'habitacions d'hostes
    MyBookingsTab.jsx        Els meus torns (bugaderia + habitacions)
    StatsTab.jsx              Ús per zona i per porta
supabase/
  schema.sql                  Taules, seguretat, dades inicials
  functions/send-due-notifications/   Envia els avisos push
public/sw.js                   Service worker que mostra les notificacions
```

## 1. Base de dades (Supabase, gratis)

1. Crea un projecte a https://supabase.com (pla Free).
2. Ves a **SQL Editor** i executa tot el contingut de `supabase/schema.sql`.
   Crea les taules, activa la seguretat (RLS) i insereix un catàleg inicial
   de 14 rentadores i 2 habitacions perquè puguis provar-ho de seguida.
3. **Edita el catàleg real**: a **Table Editor → machines**, corregeix marca,
   número i, sobretot, `short_minutes`/`long_minutes` de cada rentadora
   perquè coincideixin amb els temps reals (per defecte 60/90 min). Fes el
   mateix a **rooms** si vols canviar el nom o la planta de les habitacions.
4. A **Project Settings → API**, copia **Project URL** 'https://hghrkuuyieadditnruip.supabase.co/rest/v1/' i **anon public key**.'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnaHJrdXV5aWVhZGRpdG5ydWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjgzODMsImV4cCI6MjEwNDgwNDM4M30.c_CsEws5S0UTivYhgTaHqn1wURB5lTh_HUxdXzTrQRs'

## 2. Configurar el projecte

```
cp .env.example .env
```

Omple `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` amb els valors del pas
anterior. La clau `VITE_VAPID_PUBLIC_KEY` ja ve emplenada (veure pas 4).

```
npm install
npm run dev
```

## 3. Publicar-ho gratis (Vercel)

1. Puja el projecte a un repositori de GitHub.
2. A https://vercel.com, **Add New → Project**, tria el repositori.
3. Afegeix les variables d'entorn (les mateixes del `.env`) a **Environment
   Variables** abans de desplegar.
4. **Deploy**. Tindràs una URL pública tipus `https://reserves-cooperativa.vercel.app`.

## 4. Notificacions push (avisar el mòbil quan la bugada acaba)

Això és l'únic tram que requereix passos manuals teus, perquè cal el teu
projecte real de Supabase i les seves credencials.

**Claus VAPID**: ja te les he generat i la pública és a `.env.example`.
Guarda la clau privada en un lloc segur (no la posis mai al codi ni al
frontend):

```
VAPID_PUBLIC_KEY=BMZJZs7VmToiaV1OYndKJA3_ShFHqkjBFwDStQYaofAV_LCK9Zr1XD6WXqJ7Tomf4-rfpGb05aNH-ufmmNW0ZMg
VAPID_PRIVATE_KEY=BAHAlthPR-4iCiXv_kuUyqDn_V0j8N9_aRfWWlTWjJY
```

(Si prefereixes generar-ne un parell nou tu mateix: `npx web-push generate-vapid-keys`.)

**Desplegar la funció** (necessites la Supabase CLI: `npm i -g supabase`):

```
supabase login
supabase link --project-ref TU-PROJECT-REF
supabase functions deploy send-due-notifications
supabase secrets set VAPID_PUBLIC_KEY=BMZJZs7VmToiaV1OYndKJA3_ShFHqkjBFwDStQYaofAV_LCK9Zr1XD6WXqJ7Tomf4-rfpGb05aNH-ufmmNW0ZMg
supabase secrets set VAPID_PRIVATE_KEY=BAHAlthPR-4iCiXv_kuUyqDn_V0j8N9_aRfWWlTWjJY
supabase secrets set VAPID_SUBJECT=mailto:elteu-correu@exemple.cat
```

(`SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` ja els posa Supabase automàticament
a les Edge Functions, no cal configurar-los.)

**Programar-la perquè s'executi sola** (cada minut, per exemple). Torna al
SQL Editor de Supabase i activa les extensions `pg_cron` i `pg_net` des de
**Database → Extensions**, i després executa (substituint el teu project-ref
i la teva `service_role` key, que trobes a Project Settings → API):

```sql
select cron.schedule(
  'avisos-bugaderia',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://TU-PROJECT-REF.supabase.co/functions/v1/send-due-notifications',
    headers := jsonb_build_object('Authorization', 'Bearer TU-SERVICE-ROLE-KEY', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
```

A partir d'aquí, cada persona activa els avisos al seu mòbil des de
**Configuració → "Activa avisos quan acabi la bugada"** dins l'app (cal
acceptar el permís de notificacions del navegador).

**Limitacions a tenir en compte:**
- A iPhone/iPad, les notificacions push només funcionen si l'app s'ha
  afegit a la pantalla d'inici ("Afegeix a l'inici" des de Safari) — és una
  restricció d'Apple, no de l'app.
- El cron d'un cop per minut és gratuït dins Supabase (pg_cron/pg_net són
  extensions de Postgres, no compten dins les quotes de funcions).

## 5. Instal·lar-la com una app (recomanat per a 35 habitatges)

L'app ja és una **PWA instal·lable**: té `manifest.webmanifest`, icones i un
service worker actiu. No cal publicar-la a cap botiga d'aplicacions —
cadascú l'instal·la directament des del navegador:

- **Android/Chrome**: apareix un banner "Instal·la" dins l'app, o des del
  menú del navegador → "Instal·la l'aplicació" / "Afegeix a la pantalla
  d'inici".
- **iPhone/iPad (Safari)**: Compartir → **Afegeix a l'inici**. Als iPhones
  això és imprescindible perquè les notificacions push hi funcionin (és una
  restricció d'Apple: Safari només permet push a apps afegides a l'inici).

Un cop instal·lada, s'obre a pantalla completa amb icona pròpia, com
qualsevol altra app, sense necessitat d'App Store ni Google Play.

**Per què PWA i no una app nativa**: amb 35 habitatges i ús exclusivament
intern, una app nativa (iOS/Android per separat) suposaria compte de
desenvolupador d'Apple (99 $/any), revisió a les botigues i molt més
manteniment, sense cap avantatge real per a aquesta mida d'ús. La PWA fa el
mateix (icona, pantalla completa, avisos push) totalment gratis i amb el
mateix codi que ja teniu desplegat a Vercel.



- **Sense contrasenyes**: identificar-se és només donar un correu; l'app
  recorda la porta associada per evitar errades en escriure-la a mà. No hi
  ha xifratge d'inici de sessió — pensat per a ús intern de confiança. Si
  més endavant voleu autenticació real, es pot afegir Supabase Auth.
- **Múltiples correus per porta**: qualsevol persona pot afegir el seu
  correu a la mateixa porta des de Configuració, i totes rebran els avisos
  d'aquella porta.
- **Rentadora marcada com a acabada abans d'hora**: allibera el forat
  restant perquè algú altre la pugui reservar just després, encara que el
  torn original no hagi arribat al final teòric.
- Pots editar plantes/zones a `src/config.js` (constant `FLOORS`).
