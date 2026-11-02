// The ten TEQVORA services. The names match the options in the contact form.
// Each item is [title, description, Font Awesome icon].
window.SERVICES = [
    {
        id: 'shopify', name: 'Shopify Development', icon: 'fa-brands fa-shopify',
        cat: 'Storefront Development', kw: 'shopify store theme website build development', theme: 'orange',
        title: 'A Shopify store built to convert from day one.',
        desc: 'Fast, on-brand storefronts with clean architecture, tested checkout flows and room to grow.',
        cta: 'Plan My Store',
        items: [
            ['Custom Theme Development', 'Mobile-first themes built around your brand and products.', 'fa-swatchbook'],
            ['Checkout & Cart Setup', 'Clear, trust-building purchase flows that reduce drop-off.', 'fa-cart-shopping'],
            ['App & Speed Optimization', 'Only the apps you need, configured to keep pages fast.', 'fa-gauge-high']
        ]
    },
    {
        id: 'amazon-fba', name: 'Amazon FBA Management', icon: 'fa-brands fa-amazon',
        cat: 'Marketplace Management', kw: 'amazon fba marketplace inventory account seller', theme: 'orange',
        title: 'Run your Amazon FBA business with less guesswork.',
        desc: 'Account setup, inventory planning and day-to-day management for sellers who want steady, profitable growth.',
        cta: 'Talk About My Account',
        items: [
            ['Account Setup & Compliance', 'Seller account, brand registry and policy-safe listings.', 'fa-clipboard-check'],
            ['Inventory & Shipment Planning', 'Restock plans that limit stockouts and storage fees.', 'fa-boxes-stacked'],
            ['Account Health Monitoring', 'Regular checks on performance metrics and reported issues.', 'fa-shield-halved']
        ]
    },
    {
        id: 'tiktok', name: 'TikTok Shop Management', icon: 'fa-brands fa-tiktok',
        cat: 'Social Commerce', kw: 'tiktok shop social video live creator affiliate', theme: 'tiktok',
        title: 'Turn short video into TikTok Shop sales.',
        desc: 'Shop setup, creator partnerships and live selling support to help your products get found.',
        cta: 'Launch On TikTok',
        items: [
            ['Shop Setup & Compliance', 'Seller onboarding, catalogue upload and policy-safe listings.', 'fa-clipboard-check'],
            ['Creator & Affiliate Outreach', 'Find, brief and manage creators who fit your products.', 'fa-people-group'],
            ['Live Shopping Support', 'Live-stream planning and promotion of your best-performing videos.', 'fa-tower-broadcast']
        ]
    },
    {
        id: 'walmart', name: 'Walmart Marketplace', icon: 'fa-solid fa-store',
        cat: 'Marketplace Management', kw: 'walmart marketplace listings seller wfs', theme: 'orange',
        title: 'Reach Walmart shoppers with a well-run storefront.',
        desc: 'Approval support, catalogue setup and ongoing management for your Walmart Marketplace store.',
        cta: 'Start On Walmart',
        items: [
            ['Seller Approval Support', 'Guidance through the application and onboarding steps.', 'fa-user-check'],
            ['Catalogue & Listing Setup', 'Accurate product data, images and categories.', 'fa-list-check'],
            ['Order & Performance Tracking', 'Keep an eye on orders, returns and seller scorecard metrics.', 'fa-chart-line']
        ]
    },
    {
        id: 'etsy', name: 'Etsy Store Management', icon: 'fa-brands fa-etsy',
        cat: 'Marketplace Management', kw: 'etsy store shop handmade listings seo', theme: 'orange',
        title: 'Grow your Etsy shop with a clear plan.',
        desc: 'Shop setup, listing optimization and ongoing management to help buyers find your products.',
        cta: 'Improve My Shop',
        items: [
            ['Shop Setup & Branding', 'A consistent shop look, policies and profile that build trust.', 'fa-palette'],
            ['Listing SEO', 'Titles, tags and descriptions written around what buyers search for.', 'fa-magnifying-glass'],
            ['Order & Customer Care', 'Help with orders, messages and reviews so nothing slips.', 'fa-envelope-open-text']
        ]
    },
    {
        id: 'research', name: 'Product Research & Sourcing', icon: 'fa-solid fa-magnifying-glass-chart',
        cat: 'Product Strategy', kw: 'product research sourcing supplier niche wholesale private label', theme: 'orange',
        title: 'Choose products and suppliers with confidence.',
        desc: 'Market research and supplier sourcing that help you decide what to sell before you invest in stock.',
        cta: 'Find My Next Product',
        items: [
            ['Market & Competitor Research', 'Demand, competition and pricing reviewed for your niche.', 'fa-chart-pie'],
            ['Supplier Sourcing', 'Shortlisted suppliers compared on price, quality and terms.', 'fa-handshake'],
            ['Margin Estimates', 'Landed-cost and profit estimates so the numbers work before you commit.', 'fa-calculator']
        ]
    },
    {
        id: 'ppc', name: 'Amazon PPC', icon: 'fa-solid fa-chart-line',
        cat: 'Advertising', kw: 'amazon ppc ads advertising sponsored acos campaigns', theme: 'orange',
        title: 'Amazon advertising that pays attention to profit.',
        desc: 'Campaign setup and regular optimization focused on sales you keep, not just clicks.',
        cta: 'Review My Ads',
        items: [
            ['Campaign Structure', 'Organized campaigns by product, match type and goal.', 'fa-sitemap'],
            ['Keyword & Bid Optimization', 'Regular bid changes and negative keywords to limit wasted spend.', 'fa-bullseye'],
            ['Clear Reporting', 'Straightforward reports on spend, sales and where to improve.', 'fa-file-lines']
        ]
    },
    {
        id: 'listing', name: 'Product Listing Optimization', icon: 'fa-solid fa-list-check',
        cat: 'Conversion', kw: 'listing optimization product content seo images a+ titles bullets', theme: 'orange',
        title: 'Listings that rank and give shoppers a reason to buy.',
        desc: 'Keyword-led copy, images and content that make your products easier to find and easier to choose.',
        cta: 'Optimize My Listings',
        items: [
            ['Keyword-Led Copy', 'Titles, bullets and descriptions based on real search terms.', 'fa-keyboard'],
            ['Image & A+ Content', 'Clear product images and enhanced content that answer buyer questions.', 'fa-image'],
            ['Ongoing Testing', 'Small, tracked changes to improve results over time.', 'fa-flask']
        ]
    },
    {
        id: 'branding', name: 'Branding & Graphic Design', icon: 'fa-solid fa-pen-ruler',
        cat: 'Brand & Creative', kw: 'branding graphic design logo packaging creative identity', theme: 'orange',
        title: 'A brand that looks consistent everywhere you sell.',
        desc: 'Logos, packaging and marketing graphics designed to make your products look professional.',
        cta: 'Start My Brand',
        items: [
            ['Logo & Brand Identity', 'Logo, colours and typography packaged into simple brand guidelines.', 'fa-signature'],
            ['Packaging & Label Design', 'Print-ready packaging and label artwork.', 'fa-box-open'],
            ['Marketing Graphics', 'Banners, social posts and store graphics in your brand style.', 'fa-photo-film']
        ]
    },
    {
        id: 'virtual-assistant', name: 'Virtual Assistant Services', icon: 'fa-solid fa-headset',
        cat: 'Operations Support', kw: 'virtual assistant va support admin customer service data entry', theme: 'orange',
        title: 'Reliable day-to-day help for your online store.',
        desc: 'Trained assistants who handle routine store tasks so you can spend your time on growth.',
        cta: 'Get Support',
        items: [
            ['Customer Support', 'Replies to customer messages and order questions.', 'fa-comments'],
            ['Order & Listing Admin', 'Order processing, catalogue updates and data entry.', 'fa-clipboard-list'],
            ['Research & Reporting', 'Routine research tasks and simple weekly summaries.', 'fa-file-lines']
        ]
    }
];
