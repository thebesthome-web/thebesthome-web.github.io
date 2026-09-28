import { services } from './services.mjs';

const email = 'thebesthomeinfo@gmail.com';
const phone = '+420 777 004 733';
const phoneHref = 'tel:+420777004733';
const arrow = '<span aria-hidden="true">↗</span>';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const siteUrl = 'https://thebesthome.cz/';
const serviceArea = 'Působíme především v Praze a Středočeském kraji.';
const areaServed = [{ '@type': 'City', name: 'Praha' }, { '@type': 'AdministrativeArea', name: 'Středočeský kraj' }];
const gallerySizes = '(max-width: 760px) calc(100vw - 40px), (max-width: 1080px) calc((100vw - 88px) / 3), (max-width: 1280px) calc((100vw - 120px) / 3), 387px';
const projectCardSizes = '(max-width: 760px) calc(100vw - 40px), (max-width: 1080px) calc((100vw - 104px) / 3), (max-width: 1280px) calc((100vw - 136px) / 3), 382px';
const serviceCardSizes = '(max-width: 760px) calc(100vw - 98px), (max-width: 1080px) calc((100vw - 147px) / 2), (max-width: 1280px) calc((100vw - 309px) / 4), 243px';

function structuredData(page, title, description, service) {
  const url = new URL(page === 'index.html' ? '' : page, siteUrl).href;
  const company = {
    '@type': 'GeneralContractor', '@id': `${siteUrl}#company`, name: 'The Best Home s.r.o.',
    url: siteUrl, logo: `${siteUrl}logo/logo.png`, image: `${siteUrl}images/bg-v2.jpg`,
    description: 'Stavební firma pro Prahu a Středočeský kraj. Výstavba, rekonstrukce a dokončovací práce.',
    telephone: '+420777004733', email,
    address: { '@type': 'PostalAddress', streetAddress: 'Pražská 298/59', addressLocality: 'Brandýs nad Labem-Stará Boleslav', postalCode: '250 01', addressCountry: 'CZ' },
    areaServed,
    identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: '22383964' },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:00' }],
    contactPoint: [{ '@type': 'ContactPoint', telephone: '+420777004733', contactType: 'customer service' }, { '@type': 'ContactPoint', telephone: '+420777006335', contactType: 'customer service' }],
    sameAs: ['https://www.facebook.com/profile.php?id=61584567283955'],
  };
  const graph = [company,
    { '@type': 'WebSite', '@id': `${siteUrl}#website`, url: siteUrl, name: 'The Best Home', inLanguage: 'cs', publisher: { '@id': company['@id'] } },
    { '@type': page === 'kontakty.html' ? 'ContactPage' : page === 'reference.html' ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'cs', isPartOf: { '@id': `${siteUrl}#website` }, about: { '@id': company['@id'] }, ...(service ? { mainEntity: { '@id': `${url}#service` }, breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}) },
  ];
  if (service) {
    graph.push(
      { '@type': 'Service', '@id': `${url}#service`, name: service.title, serviceType: service.title, description: service.intro, url, areaServed, provider: { '@id': company['@id'] } },
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Služby', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: service.title, item: url },
      ] },
    );
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

export function renderSite({ projects, images, version }) {
  const byId = Object.fromEntries(projects.map(project => [project.id, project]));
  function img(source, alt, { sizes = gallerySizes, eager = false, className = '', profile = 'original' } = {}) {
    const item = profile === 'original' ? images[source] : images[source]?.previews?.[profile];
    if (!item) throw new Error(`Missing image: ${source}`);
    const fallback = item.variants.find(variant => variant.width >= 800) ?? item.variants.at(-1);
    return `<img src="${fallback.src}" srcset="${item.variants.map(variant => `${variant.src} ${variant.width}w`).join(', ')}" sizes="${sizes}" width="${fallback.width}" height="${fallback.height}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}${className ? ` class="${className}"` : ''}>`;
  }
  const navLinks = [['index.html', 'Služby'], ['reference.html', 'Naše práce'], ['kariera.html', 'Kariéra'], ['kontakty.html', 'Kontakty']];
  function header(page) {
    return `<a class="skip-link" href="#main">Přejít na obsah</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="index.html">${img('logo/logo.png', '', { sizes: '(max-width: 380px) 80px, 107px', eager: true })}<span>THE BEST HOME</span></a>
    <nav class="desktop-nav" aria-label="Hlavní navigace">${navLinks.map(([href, label]) => `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <a class="button button-small header-cta" href="kontakty.html#kontakt">Napište nám ${arrow}</a>
    <details class="mobile-menu"><summary>Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Mobilní navigace">${navLinks.map(([href, label]) => `<a href="${href}"${page === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></details>
  </div>
</header>`;
  }
  const footer = `<footer class="site-footer">
  <div class="container footer-grid">
    <div><a class="footer-brand" href="index.html">THE BEST HOME<span aria-hidden="true">.</span></a><p>Od prvního plánu po poslední detail.<br>Výstavba, rekonstrukce a interiéry.</p><a class="footer-social" href="https://www.facebook.com/profile.php?id=61584567283955" target="_blank" rel="noopener noreferrer">Najdete nás i na Facebooku ${arrow}</a></div>
    <div><h2>Ozvěte se nám</h2><a class="footer-phone" href="${phoneHref}">${phone}</a><a href="tel:+420777006335">+420 777 006 335</a><a href="mailto:${email}">${email}</a><p>Po–Pá · 9:00–18:00</p></div>
    <div><h2>The Best Home s.r.o.</h2><p>Pražská 298/59<br>250 01 Brandýs nad Labem<br>IČO: 22383964</p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=The%20Best%20Home%20s.r.o.%2C%20Pra%C5%BEsk%C3%A1%20298%2F59%2C%20250%2001%20Brand%C3%BDs%20nad%20Labem-St%C3%A1r%C3%A1%20Boleslav%2C%20Czechia" target="_blank" rel="noopener noreferrer">Jak se k nám dostanete ${arrow}</a></div>
  </div>
  <div class="container footer-bottom"><span>© 2025–2026 The Best Home s.r.o.</span><span>C 414997/MSPH · Městský soud v Praze</span><a href="#">Zpět nahoru ↑</a></div>
</footer>`;
  function cta(title = 'Co společně postavíme?', text = 'Napište nám, co plánujete. Probereme rozsah prací, vaše představy a další postup.') {
    return `<section class="cta-section"><div class="container cta-inner"><div><p class="eyebrow">VÁŠ PROJEKT ZAČÍNÁ ROZHOVOREM</p><h2>${title}</h2><p>${text}</p></div><div class="cta-actions"><a class="button" href="kontakty.html#kontakt">Ozvěte se nám ${arrow}</a><a class="text-link" href="${phoneHref}">Nebo zavolejte ${phone}</a></div></div></section>`;
  }
  function layout(page, title, description, content, extra = '', { service, image = 'images/bg-v2.jpg', imageAlt = 'The Best Home – stavební firma' } = {}) {
    const url = `https://thebesthome.cz/${page === 'index.html' ? '' : page}`;
    return `<!DOCTYPE html>
<!-- Generated by npm run build. Edit src/pages.mjs, src/services.mjs and data/projects.json. -->
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#202723">
  <link rel="canonical" href="${url}">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:site_name" content="The Best Home">
  <meta property="og:image" content="${siteUrl}${image}">
  <meta property="og:image:alt" content="${escape(imageAlt)}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${structuredData(page, title, description, service)}</script>
  <link rel="icon" type="image/png" sizes="32x32" href="favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon/favicon-16x16.png">
  <link rel="apple-touch-icon" href="favicon/apple-touch-icon.png">
  <link rel="manifest" href="favicon/manifest.json">
  <link rel="preload" href="fonts/merriweather-brand-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/site.css?v=${version}">
  <script src="js/site.js?v=${version}" defer></script>
</head>
<body id="top">
${header(page)}
<main id="main">${content}</main>
${footer}
<nav class="mobile-contact" aria-label="Rychlý kontakt"><a href="${phoneHref}">Zavolat</a><a href="${page === 'kontakty.html' ? '#kontakt' : 'kontakty.html#kontakt'}">Kontakt ${arrow}</a></nav>
${extra}
</body>
</html>
`;
  }
  function projectCard(id, index, title, label) {
    const project = byId[id];
    const photo = project.photos[index];
    return `<article class="project-card"><a href="reference.html#${id}"><div class="project-image${id === 'klinika' ? ' project-image-wide' : ''}">${img(photo.src, photo.alt, { profile: id === 'klinika' ? 'original' : 'gallery', sizes: projectCardSizes })}<span class="image-link" aria-hidden="true">↗</span></div><p class="eyebrow">${label}</p><h3>${title} ${arrow}</h3><span class="text-link">Prohlédnout realizaci</span></a></article>`;
  }
  const home = `
<section class="hero">
  <video class="hero-background-video" muted loop playsinline preload="none" poster="video/poster.jpg" data-src="video/video.mp4" aria-hidden="true" tabindex="-1"></video>
  <div class="container hero-grid">
    <div class="hero-copy"><p class="eyebrow"><span class="accent-line"></span> THE BEST HOME · STAVEBNÍ FIRMA</p><h1>Vaše představa.<br>Naše práce.<br><span>Váš nový prostor.</span></h1><p class="hero-lead">Stavíme a rekonstruujeme byty, domy i komerční prostory především v Praze a Středočeském kraji. Od stavebních prací a rozvodů až po hotový interiér.</p><div class="button-row"><a class="button" href="kontakty.html#kontakt">Probrat můj projekt ${arrow}</a><a class="button button-outline" href="reference.html">Prohlédnout naši práci</a></div></div>
  </div>
</section>
<div class="service-strip"><div class="container"><span>Byty a rodinné domy</span><span>Ordinace a komerční prostory</span><span>Stavby i dokončovací práce</span></div></div>
<section class="section" id="sluzby">
  <div class="container"><div class="section-heading"><div><p class="eyebrow">CO PRO VÁS UDĚLÁME</p><h2>Od základů<br>po poslední detail.</h2></div><p>Kompletní realizace i jednotlivé práce.<br>Vyberte, s čím vám můžeme pomoci.</p></div>
  <div class="services-grid">
    ${services.map(service => `<article class="service-card">${img(service.image, service.imageAlt, { profile: 'service', className: 'service-card-image', sizes: serviceCardSizes })}<h3><a href="${service.slug}.html">${escape(service.title)}</a></h3><p>${escape(service.description)}</p><div class="service-card-actions"><a class="text-link" href="${service.slug}.html" aria-label="Více o službě: ${escape(service.title)}">Více o službě ${arrow}</a><a class="text-link" href="kontakty.html#kontakt" aria-label="Kontaktovat nás ohledně: ${escape(service.title)}">Kontaktovat nás</a></div></article>`).join('\n    ')}
  </div>
  </div>
</section>
<section class="section section-tint" id="realizace"><div class="container"><div class="section-heading"><div><p class="eyebrow">ZA NÁS MLUVÍ PRÁCE</p><h2>Podívejte se na výsledek.</h2></div><a class="text-link" href="reference.html">Všechny realizace ${arrow}</a></div><div class="projects-grid">${projectCard('klinika', 0, 'Výstavba stomatologické kliniky', 'VÝSTAVBA KOMERČNÍCH PROSTOR')}${projectCard('kuchyne', 5, 'Kuchyně připravená k bydlení', 'MONTÁŽ KUCHYNĚ')}${projectCard('design', 1, 'Interiér s vlastním charakterem', 'DEKORATIVNÍ ÚPRAVY')}</div></div></section>
<section class="section" id="postup"><div class="container"><div class="section-heading"><div><p class="eyebrow">JAK ZAČÍT</p><h2>Nejdřív si řekneme,<br>co potřebujete.</h2></div><p>Nemusíte mít hotový projekt.<br>Začněte tím, co už víte.</p></div><ol class="steps"><li><span>01</span><h3>Popište svůj záměr</h3><p>Co chcete stavět nebo upravit, kde a v jakém rozsahu. Pomohou i fotografie současného stavu.</p></li><li><span>02</span><h3>Probereme možnosti</h3><p>Společně upřesníme zadání, technické řešení a případnou prohlídku místa.</p></li><li><span>03</span><h3>Domluvíme další postup</h3><p>Rozsah, cenu i možný termín probereme podle konkrétního projektu, před zahájením prací.</p></li></ol></div></section>
<section class="section section-tint"><div class="container faq-layout"><div><p class="eyebrow">JEŠTĚ VÁS MOŽNÁ ZAJÍMÁ</p><h2>Než se do toho pustíme.</h2><a class="text-link" href="kontakty.html">Máte jinou otázku? Napište nám ${arrow}</a></div><div class="faq"><details><summary>Kolik bude rekonstrukce stát?</summary><p>Cena závisí na rozsahu prací, stavu prostoru a zvolených materiálech. Pošlete stručný popis a fotografie; pro konkrétní nabídku s vámi upřesníme potřebné podklady.</p></details><details><summary>Mohu se ozvat i s menší zakázkou?</summary><p>Ano, vedle kompletních realizací nabízíme také jednotlivé práce: montáž kuchyně, malování, podlahy, rozvody nebo úpravy koupelny. Napište, s čím potřebujete pomoci.</p></details><details><summary>Co si mám připravit k poptávce?</summary><p>Stačí typ práce, místo realizace a přibližný rozsah. Pokud máte rozměry, fotografie, projekt nebo představu o termínu, připojte je k e-mailu.</p></details><details><summary>Kdy můžete začít a kde pracujete?</summary><p>${serviceArea} Naše sídlo je v Brandýse nad Labem. Napište nám místo a požadovaný termín realizace; aktuální kapacitu a další postup ověříme pro vaši zakázku.</p></details></div></div></section>
${cta()}`;

  function galleryPhoto(photo, id, eager = false) {
    const original = images[photo.src];
    const variants = original.variants;
    return `<a class="gallery-photo${id === 'klinika' ? ' gallery-comparison' : ''}" href="${photo.src}" data-gallery="${id}" data-width="${original.width}" data-height="${original.height}" data-large="${variants.at(-1).src}" data-srcset="${variants.map(v => `${v.src} ${v.width}w`).join(', ')}" aria-label="${escape(photo.alt)} – zvětšit">${img(photo.src, photo.alt, { eager, profile: id === 'klinika' ? 'original' : 'gallery', sizes: id === 'klinika' ? '(max-width: 760px) calc(100vw - 40px), (max-width: 1080px) calc((100vw - 68px) / 2), (max-width: 1280px) calc((100vw - 100px) / 2), 590px' : gallerySizes })}</a>`;
  }
  const projectIntros = {
    klinika: ['Výstavba stomatologické kliniky', 'Realizace nové stomatologické kliniky od stavebních prací po dokončený interiér. Fotografie ukazují čekárny, ordinace a společné prostory i sociální a technické zázemí potřebné pro provoz kliniky.'],
    kuchyne: ['Montáž kuchyní a nábytku', 'Ukázky demontáže původních kuchyní, sestavování nových skříněk a montáže kuchyňských linek. Vedle průběhu prací si můžete prohlédnout hotové sestavy, usazení pracovních desek a detaily dokončeného nábytku.'],
    'kuchyne-koupelna': ['Rekonstrukce kuchyně a koupelny', 'Dokončené části rekonstrukce kuchyně a koupelny. Nová kuchyňská linka s pracovní a varnou deskou navazuje na úpravy podlahy. V koupelně fotografie zachycují obklady, umyvadlo, prostor pro pračku a vanu se sprchovou zástěnou.'],
    design: ['Dekorativní stěny, tapety a podsvícení', 'Realizace dekorativních úprav interiéru od přípravy stěny po finální povrch a osvětlení. Galerie ukazuje modrou dekorativní stěnu i stěnu s tapetou a podsvícením v průběhu prací a po dokončení.'],
    rozvody: ['Montáž rozvodů vody, kanalizace a vytápění', 'Hrubé rozvody v novostavbách podle projektové dokumentace. Snímky zachycují vedení potrubí v různých etapách montáže před zakrytím konstrukcí. Součástí galerie jsou i podklady, podle kterých se rozmístění rozvodů plánovalo.'],
    podlahy: ['Pokládka podlah ve zdravotnických prostorech', 'Jednotlivé etapy realizace podlah ve zdravotnických prostorech: penetrace podkladu, pokládka elektrostatických pásek a navazujících vrstev. Fotografie dokumentují přípravu i dokončenou vinylovou podlahu.'],
  };
  const projectScopes = {
    klinika: ['Čekárny a stomatologické ordinace', 'Sociální a technické zázemí'],
    kuchyne: ['Demontáž a sestavování kuchyňských linek', 'Skříňky, pracovní desky a finální usazení'],
    'kuchyne-koupelna': ['Kuchyňská linka a pracovní plocha', 'Koupelna s obklady, umyvadlem a vanou'],
    design: ['Příprava a dekorativní úprava stěn', 'Tapety a podsvícení'],
    rozvody: ['Rozvody vody, kanalizace a topení', 'Montáž podle projektových podkladů'],
    podlahy: ['Příprava podkladu a jednotlivých vrstev', 'Dokončení podlahových povrchů'],
  };
  const reference = `<section class="page-intro"><div class="container"><p class="eyebrow">NAŠE REALIZACE</p><h1>Práce, kterou<br><span>si můžete prohlédnout.</span></h1><div class="intro-bottom"><p>Skutečné fotografie z našich zakázek. Od prvních stavebních prací až po hotový prostor.</p><a class="button" href="kontakty.html#kontakt">Mám podobný projekt ${arrow}</a></div><nav class="project-nav" aria-label="Typ realizace">${['klinika', 'kuchyne', 'kuchyne-koupelna', 'design', 'rozvody', 'podlahy'].map(id => `<a href="#${id}">${byId[id].label}</a>`).join('')}</nav></div></section>
<div class="container">${['klinika', 'kuchyne', 'kuchyne-koupelna', 'design', 'rozvody', 'podlahy'].map((id, i) => {
    const project = byId[id];
    const [title, description] = projectIntros[id];
    const lead = id === 'kuchyne' ? [5, 11, 8] : id === 'design' ? [5, 1, 4] : id === 'podlahy' ? [6, 5, 7] : id === 'klinika' ? [0, 1] : [0, 1, 2];
    const rest = project.photos.filter((_, index) => !lead.includes(index));
    return `<section class="project-section" id="${id}" aria-labelledby="title-${id}"><div class="project-heading"><div><h2 id="title-${id}">${title}</h2><ul class="project-scope">${projectScopes[id].map(item => `<li>${escape(item)}</li>`).join('')}</ul></div><div><p>${description}</p><div class="project-services">${services.filter(service => service.projects.includes(id)).map(service => `<a class="text-link" href="${service.slug}.html">${escape(service.title)}</a>`).join('')}</div><a class="text-link" href="kontakty.html#kontakt">Ozvěte se nám ${arrow}</a></div></div><div class="gallery-grid${id === 'klinika' ? ' gallery-grid-two' : ''}">${lead.map((index, n) => galleryPhoto(project.photos[index], id, i === 0 && n === 0)).join('')}</div>${rest.length ? `<details class="more-photos"><summary>Zobrazit další fotografie (${rest.length})</summary><div class="gallery-grid${id === 'klinika' ? ' gallery-grid-two' : ''}">${rest.map(photo => galleryPhoto(photo, id)).join('')}</div></details>` : ''}</section>`;
  }).join('')}</div>${cta('Podobná proměna může čekat i vás.')}`;

  const contacts = `<section class="page-intro contact-intro"><div class="container"><p class="eyebrow">POJĎME PROBRAT VÁŠ PROJEKT</p><h1>Každá proměna<br>začíná <span>rozhovorem.</span></h1><p class="intro-lead">${serviceArea} Řekněte nám, co plánujete a kde. Společně najdeme další krok.</p></div></section>
<section class="section contact-section" id="kontakt"><div class="container contact-layout">
  <div class="contact-info">
    <p class="eyebrow">KONTAKTUJTE NÁS PŘÍMO</p>
    <h2>Zavolejte. Napište.<br>Rádi vás vyslechneme.</h2>
    <div class="contact-methods"><a class="contact-phone" href="${phoneHref}">${phone} ${arrow}</a><a class="contact-secondary" href="tel:+420777006335">+420 777 006 335 ${arrow}</a><p class="contact-hours">Po–Pá · 9:00–18:00</p><a class="contact-email" href="mailto:${email}">${email} ${arrow}</a></div>
    <div class="contact-address"><h3>The Best Home s.r.o.</h3><p>Pražská 298/59<br>250 01 Brandýs nad Labem<br>IČO: 22383964</p><a class="text-link" href="https://www.google.com/maps/dir/?api=1&amp;destination=The%20Best%20Home%20s.r.o.%2C%20Pra%C5%BEsk%C3%A1%20298%2F59%2C%20250%2001%20Brand%C3%BDs%20nad%20Labem-St%C3%A1r%C3%A1%20Boleslav%2C%20Czechia" target="_blank" rel="noopener noreferrer">Zobrazit cestu ${arrow}</a></div>
  </div>
</div></section>`;

  const career = `<section class="section career-hero"><div class="career-image">${img('images/worker.jpg', '', { eager: true, sizes: '100vw' })}</div><div class="container hero-grid"><div><p class="eyebrow">KARIÉRA V THE BEST HOME</p><h1>Dobrá práce<br>začíná <span>dobrým týmem.</span></h1><p class="hero-lead">Hledáme kolegy, kteří rozumějí svému řemeslu a záleží jim na výsledku. Pojďte s námi stavět a měnit prostory.</p><div class="button-row"><a class="button" href="mailto:${email}?subject=Z%C3%A1jem%20o%20pr%C3%A1ci%20v%20The%20Best%20Home">Mám zájem o práci ${arrow}</a><a class="text-link" href="tel:+420777006335">+420 777 006 335</a></div></div></div></section>
<section class="section section-tint"><div class="container career-layout"><div><p class="eyebrow">KOHO HLEDÁME</p><h2>Najdete se v některém<br>z těchto řemesel?</h2><ul class="jobs"><li>Zedník</li><li>Obkladač</li><li>Instalátor</li><li>Podlahář</li><li>Malíř</li><li>Pomocný pracovník na stavbě</li></ul><p>Hledáte jinou spolupráci ve stavebnictví? Ozvěte se nám i tak.</p></div><div class="benefits"><h2>Co nabízíme</h2><ul><li>Mzdu podle zkušeností a kvalifikace</li><li>Zajímavé stavební projekty</li><li>Výkonnostní bonusy a odměny</li><li>Interní školení a profesní růst</li><li>Zajištění pracovní výstroje</li></ul><h3>Jak se přihlásit?</h3><p>Napište, jaké máte zkušenosti, o jakou práci máte zájem a kdy můžete nastoupit. Nebo nám rovnou zavolejte.</p><a class="text-link" href="mailto:${email}?subject=Z%C3%A1jem%20o%20pr%C3%A1ci">${email} ${arrow}</a></div></div></section>`;

  const galleryDialog = `<dialog class="lightbox" id="gallery-dialog" aria-label="Fotografie realizace"><div class="lightbox-bar"><span id="gallery-count" aria-live="polite"></span><div><a id="gallery-original" href="reference.html" target="_blank" rel="noopener">Otevřít originál ${arrow}</a><button type="button" class="icon-button" data-close aria-label="Zavřít fotografii">×</button></div></div><figure><img id="gallery-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt=""><figcaption id="gallery-caption" aria-live="polite"></figcaption></figure><p id="gallery-error" role="status" hidden>Fotografii se nepodařilo načíst. Zkuste otevřít originál.</p><div class="lightbox-controls"><button type="button" class="button button-outline" id="gallery-prev" aria-label="Předchozí fotografie">← Předchozí</button><button type="button" class="button button-outline" id="gallery-next" aria-label="Další fotografie">Další →</button></div></dialog>`;
  const pages = {
    'index.html': layout('index.html', 'Stavební firma Praha a Středočeský kraj | The Best Home', 'Výstavba, rekonstrukce bytů, domů a ordinací v Praze a Středočeském kraji. Stavební i dokončovací práce, montáž kuchyní a rozvody. Prohlédněte si naše realizace.', home),
    'reference.html': layout('reference.html', 'Reference – stavby a rekonstrukce | The Best Home', 'Fotografie našich realizací: výstavba kliniky, rekonstrukce kuchyní a koupelen, montáž kuchyní, rozvody, podlahy a interiéry.', reference, galleryDialog),
    'kontakty.html': layout('kontakty.html', 'Kontakt – stavební firma The Best Home', 'Zavolejte +420 777 004 733 nebo napište The Best Home. Stavby a rekonstrukce především v Praze a Středočeském kraji. Sídlo: Pražská 298/59, Brandýs nad Labem.', contacts),
    'kariera.html': layout('kariera.html', 'Práce ve stavebnictví – kariéra | The Best Home', 'Hledáme zedníky, obkladače, instalatéry, podlaháře, malíře a pomocné pracovníky. Přidejte se k týmu The Best Home.', career),
    'footer.html': footer + '\n',
  };
  for (const service of services) {
    const content = `
<section class="page-intro"><div class="container">
  <nav class="breadcrumbs" aria-label="Drobečková navigace"><a href="index.html#sluzby">Služby</a><span aria-hidden="true">/</span><span aria-current="page">${escape(service.title)}</span></nav>
  <p class="eyebrow">PRAHA A STŘEDOČESKÝ KRAJ</p>
  <h1>${escape(service.title)}</h1>
  <div class="intro-bottom"><p>${escape(service.description)}</p><a class="button" href="kontakty.html#kontakt">Probrat zakázku ${arrow}</a></div>
</div></section>
<section class="section"><div class="container service-detail-grid">
  <div>
    <p>${escape(service.intro)}</p>
    <h2>Co pro vás zajistíme</h2>
    <ul>${service.scope.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
    <h2>Co nám poslat pro první domluvu</h2>
    <p>${escape(service.preparation)}</p>
    <h2>Kde pracujeme</h2>
    <p>${serviceArea} Sídlíme v Brandýse nad Labem. Napište nám místo realizace a představu o termínu; konkrétní možnosti a další postup s vámi upřesníme.</p>
  </div>
  <aside class="service-detail-aside" aria-label="Ukázky a související služby">
    ${img(service.image, service.imageAlt, { profile: 'service', eager: true, className: 'service-detail-image', sizes: '(max-width: 760px) calc(100vw - 40px), (max-width: 1280px) 44vw, 517px' })}
    ${service.projects.length ? `<div class="service-related"><h2>Ukázky naší práce</h2><ul>${service.projects.map(id => `<li><a href="reference.html#${id}">${escape(projectIntros[id][0])}</a></li>`).join('')}</ul></div>` : ''}
    <div class="service-related"><h2>Další stavební služby</h2><ul>${services.filter(other => other.id !== service.id).map(other => `<li><a href="${other.slug}.html">${escape(other.title)}</a></li>`).join('')}</ul></div>
  </aside>
</div></section>
${cta()}`;
    pages[`${service.slug}.html`] = layout(`${service.slug}.html`, `${service.title} – Praha a okolí | The Best Home`, service.metaDescription, content, '', { service, image: service.image, imageAlt: service.imageAlt });
  }
  return pages;
}
