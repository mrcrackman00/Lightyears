# 🚀 CURSOR MEIN KAISE SHURU KARNA HAI (Step by step)

> Yeh file tujhe batati hai ki Cursor open karke kya karna hai.
> Tujhe khud code nahi likhna — Cursor likhega. Tujhe sirf neeche ke prompts copy-paste karne hain.

---

## STEP 1 — Cursor mein folder kholo
1. Cursor open karo.
2. `File → Open Folder` → yeh folder chuno: `C:\Users\avinash\Lightyears`
3. Left side mein tujhe `BUILD_PLAN.md` aur yeh file dikhegi.

## STEP 2 — Cursor ko plan padhao
Cursor ka chat (Ctrl+L) kholo aur yeh exact message bhejo:

```
Read BUILD_PLAN.md in this folder. It's the full spec for a project called "Lightyears".
Confirm you understand the goal, the tech stack, and the phases. Don't write code yet —
just tell me in 3 lines what we're building and what Phase 0 + Phase 1 are.
```

## STEP 3 — Phase 0 banao (setup + star data)
Jab Cursor confirm kar de, yeh bhejo:

```
Now do PHASE 0 from BUILD_PLAN.md:
1. Create the full folder structure (index.html, css/style.css, js/*.js empty files,
   data/, assets/, README.md, LICENSE with MIT).
2. Write a Node.js script (data/build-stars.js) that downloads the HYG v4.1 CSV from
   the URL in the plan, keeps only rows where dist < 100000 AND (mag <= 6.5 OR proper
   is non-empty), extracts columns (proper, bf, ra, dec, dist, mag, ci, spect, con,
   x, y, z), and writes data/stars.json.
3. Run the script and show me how many stars ended up in stars.json.
Follow the verified facts in the plan exactly (dist is in parsecs, light_years = dist * 3.262).
```

## STEP 4 — Phase 1 banao (Find Your Star — pehla ship!)
```
Now build PHASE 1 "Find Your Star" from BUILD_PLAN.md.
Make it BEAUTIFUL — dark cinematic space theme, animated twinkling background, a glowing
"Find my star" button, and an emotional result card. Implement js/stars.js (loadStars,
ageFromBirthday, findStarForAge, colorForCi) exactly as the plan describes. Use warm,
awe-inspiring microcopy. Mobile-first. Then tell me how to run it locally.
```

## STEP 5 — Local pe chalao aur dekho
Cursor `npx serve .` ya VS Code Live Server batayega. Browser mein kholo, apni birthday
daalo, apna star dekho. 🎉

## STEP 6 — GitHub pe daalo + Stardance pe ship karo
```
Help me push this to a new public GitHub repo called "lightyears", enable GitHub Pages,
and give me the live URL.
```
Phir Stardance pe: repo link karo → devlog likho → Ship button dabao. → STARDUST shuru!

---

## ⚠️ ZAROORI BAATEIN
- Har phase ke baad **ship karo** (GitHub push + Stardance). Chhota progress bhi count hota hai.
- `file://` se mat kholna — hamesha local server (`npx serve .`) use karna, warna 3D/data load nahi hoga.
- Atak jao to Cursor ko bolo: *"BUILD_PLAN.md dekho aur [problem] fix karo."*
- Agla phase tab karo jab pichla chal jaye. Jaldi nahi — consistency.

## 📂 IS FOLDER MEIN KYA HAI
- `BUILD_PLAN.md` → poora technical plan (Cursor ke liye). Saari verified facts isme hain.
- `START_HERE_CURSOR.md` → yeh file (tere liye instructions).

Phase 2-5 ke liye bas Cursor ko bolo: *"Now do Phase 2 from BUILD_PLAN.md"* — aur aage badhte raho.
