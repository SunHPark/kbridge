import base64, json, os, re, datetime
SITE = os.environ.get("SITE_URL", "https://kev-camp-guide.vercel.app").rstrip("/")
s = open('src/template.html').read()
data = open('src/data.js').read(); art = open('src/art.js').read(); extra = open('src/places-extra.js').read()
b = "data:image/png;base64," + base64.b64encode(open('images/logo-black.png','rb').read()).decode()
w = "data:image/png;base64," + base64.b64encode(open('images/logo-white.png','rb').read()).decode()

# JSON-LD: organization, website, upcoming camp cohorts as events
today = datetime.date.today().isoformat()
coh = re.findall(r'\["(\d{4}-\d{2}-\d{2})","(\d{4}-\d{2}-\d{2})",(\d+)(?:,SITE\+"([^"]+)")?\]', data)
org = {"@type": "Organization", "@id": SITE + "/#org", "name": "K-Bridge International Co., Ltd.", "alternateName": "케이브릿지인터내셔널",
       "url": "https://kbridgeinternational.com", "logo": SITE + "/images/icon-512.png", "email": "contact@kbridgeinternational.com", "telephone": "+82-10-3307-9552",
       "address": {"@type": "PostalAddress", "streetAddress": "33 Bongnaenaru-ro, Yeongdo-gu", "addressLocality": "Busan", "addressCountry": "KR"}}
place = {"@type": "Place", "name": "Gimhae Hanok Village (Gimhae Hanok Experience Center area)", "address": {"@type": "PostalAddress", "streetAddress": "40 Wangneung-gil", "addressLocality": "Gimhae-si", "addressRegion": "Gyeongsangnam-do", "addressCountry": "KR"}}
events = []
for st, en, n, path in coh:
    if en < today: continue
    events.append({"@type": "EducationEvent", "name": f"KEV Gimhae K-Campus · Cohort {n}", "startDate": st, "endDate": en,
                   "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled",
                   "description": "4-night, 5-day Korean language and culture camp in a Gimhae hanok: Korean class, K-POP dance, K-food, K-beauty and a Gimhae day tour.",
                   "image": [SITE + "/images/og-image.jpg"], "location": place, "organizer": {"@id": SITE + "/#org"},
                   "offers": {"@type": "Offer", "price": "650", "priceCurrency": "USD", "availability": "https://schema.org/InStock",
                              "url": "https://kbridgeinternational.com/ko" + (path or "/kev"), "validFrom": "2026-01-01"}})
ld = {"@context": "https://schema.org", "@graph": [org, {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "KEV Camp Guide", "inLanguage": ["en", "zh-Hans", "ja", "es"], "publisher": {"@id": SITE + "/#org"}}] + events}

out = (s.replace('/*DATA*/', data).replace('/*ART*/', art).replace('/*NEWPLACES*/', extra)
        .replace('__LOGO_B__', b).replace('__LOGO_W__', w).replace('__SITE__', SITE)
        .replace('__JSONLD__', json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")))
# embed K-Bridge's own photos so index.html works even when opened/uploaded alone
from PIL import Image
import io, glob
for f in sorted(glob.glob('images/photos/*.jpg')):
    im = Image.open(f).convert('RGB'); im.thumbnail((1280, 1280))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=74, optimize=True, progressive=True)
    out = out.replace('"' + f + '"', '"data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode() + '"')
open('index.html', 'w').write(out)

open('robots.txt', 'w').write(f"User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: {SITE}/sitemap.xml\n")
alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{h}" href="{SITE}/?lang={l}"/>' for h, l in [("en","en"),("zh-Hans","zh"),("ja","ja"),("es","es")])
open('sitemap.xml', 'w').write(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>{SITE}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>{alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>
  </url>
</urlset>
''')
json.dump({"name": "KEV Camp Guide · K-Bridge", "short_name": "KEV Guide", "start_url": "/", "display": "standalone", "background_color": "#ffffff", "theme_color": "#ffffff",
           "icons": [{"src": "/images/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/images/icon-512.png", "sizes": "512x512", "type": "image/png"}]},
          open('manifest.webmanifest', 'w'), ensure_ascii=False, indent=1)
print("built for", SITE, "·", len(events), "upcoming cohorts in JSON-LD")
