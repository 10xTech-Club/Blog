<?php
/**
 * Plugin Name: Beyond Academics Competition Handbook
 * Description: Adds an isolated, searchable Beyond Academics STEM competition handbook page.
 * Version: 1.1.0
 * Author: 10xTechClub
 */

if (!defined('ABSPATH')) {
    exit;
}

function beyond_academics_directory_load_assets() {
    wp_register_style(
        'beyond-academics-directory-style',
        plugin_dir_url(__FILE__) . 'assets/css/beyond-academics-directory.css',
        array(),
        '1.1.0'
    );

    wp_register_script(
        'beyond-academics-directory-script',
        plugin_dir_url(__FILE__) . 'assets/js/beyond-academics-directory.js',
        array(),
        '1.1.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'beyond_academics_directory_load_assets');

function beyond_academics_directory_markdown_paths() {
    $base_dir = plugin_dir_path(__FILE__);
    $paths = array(
        $base_dir . 'data/Beyond Academics - Blog Version.md',
        $base_dir . 'data/beyond-academics-source.md',
        WP_CONTENT_DIR . '/uploads/beyond-academics/Beyond Academics - Blog Version.md',
        WP_CONTENT_DIR . '/uploads/beyond-academics/beyond-academics-source.md',
        WP_CONTENT_DIR . '/beyond-academics/Beyond Academics - Blog Version.md',
        WP_CONTENT_DIR . '/beyond-academics/beyond-academics-source.md',
    );

    foreach ($paths as $path) {
        if (is_file($path)) {
            return $path;
        }
    }

    return false;
}

function beyond_academics_directory_parse_markdown() {
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $cache = array();

    $source_path = beyond_academics_directory_markdown_paths();
    if (!$source_path) {
        return $cache;
    }

    $markdown = file_get_contents($source_path);
    if ($markdown === false || trim($markdown) === '') {
        return $cache;
    }

    $categories = array();
    $current_index = null;

    foreach (preg_split('/\R/', $markdown) as $line) {
        if (preg_match('/^###\s+(.+)$/', trim($line), $match)) {
            $title = trim($match[1]);
            $categories[] = array(
                'title' => $title,
                'slug' => sanitize_title($title),
                'competitions' => array(),
            );
            $current_index = count($categories) - 1;
            continue;
        }

        if ($current_index === null || strpos(trim($line), '|') !== 0) {
            continue;
        }

        if (strpos($line, '|---') !== false || strpos($line, 'Competition | Category') !== false || strpos($line, 'If your child enjoys') !== false || strpos($line, 'By experience level') !== false) {
            continue;
        }

        $cells = array_map('trim', explode('|', trim($line, '|')));
        if (count($cells) < 8 || $cells[0] === '' || strtolower($cells[0]) === 'competition') {
            continue;
        }

        $website = trim($cells[7]);
        if ($website !== '' && !preg_match('/^https?:\/\//i', $website)) {
            if (stripos($website, 'official organiser website') !== false || stripos($website, 'official website') !== false || in_array(strtolower($website), array('n/a', 'varies'), true)) {
                $website = '';
            } elseif (preg_match('/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i', $website)) {
                $website = 'https://' . $website;
            }
        }

        $categories[$current_index]['competitions'][] = array(
            'name' => $cells[0],
            'category' => $cells[1] !== '' ? $cells[1] : $categories[$current_index]['title'],
            'level' => $cells[2],
            'grades' => $cells[3],
            'format' => $cells[4],
            'difficulty' => $cells[5],
            'best_for' => $cells[6],
            'official_website' => $website,
            'verification_note' => $website === '' ? 'Official website requires manual verification.' : '',
        );
    }

    $cache = array_values(array_filter($categories, function ($category) {
        return !empty($category['competitions']);
    }));
    return $cache;
}

/**
 * SEO layer: invisible metadata only. Scoped to the page that contains the shortcode.
 */
function beyond_academics_directory_is_handbook_page() {
    if (!is_singular()) {
        return false;
    }
    $post = get_queried_object();
    return $post instanceof WP_Post && has_shortcode($post->post_content, 'beyond_academics_directory');
}

function beyond_academics_directory_has_seo_plugin() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION');
}

function beyond_academics_directory_seo_title() {
    return 'Beyond Academics: The Ultimate STEM Competition Handbook';
}

function beyond_academics_directory_unique_competitions() {
    $unique = array();
    foreach (beyond_academics_directory_parse_markdown() as $category) {
        foreach ($category['competitions'] as $competition) {
            $key = strtolower(trim($competition['name']));
            if (!isset($unique[$key])) {
                $unique[$key] = array('name' => $competition['name'], 'url' => '');
            }
            if ($unique[$key]['url'] === '' && preg_match('/^https?:\/\//i', (string) $competition['official_website'])) {
                $unique[$key]['url'] = $competition['official_website'];
            }
        }
    }
    return array_values($unique);
}

function beyond_academics_directory_seo_description($count) {
    return sprintf(
        'Explore %d STEM competitions for students in robotics, AI, coding, science, math, space, drones, game development and entrepreneurship. Filter by domain, age, scope, format and difficulty.',
        $count
    );
}

function beyond_academics_directory_filter_title_parts($parts) {
    if (beyond_academics_directory_is_handbook_page() && !beyond_academics_directory_has_seo_plugin()) {
        $parts['title'] = beyond_academics_directory_seo_title();
    }
    return $parts;
}
add_filter('document_title_parts', 'beyond_academics_directory_filter_title_parts');

function beyond_academics_directory_head_seo() {
    if (!beyond_academics_directory_is_handbook_page()) {
        return;
    }

    $competitions = beyond_academics_directory_unique_competitions();
    if (empty($competitions)) {
        return;
    }

    $post = get_queried_object();
    $url = get_permalink($post);
    $title = beyond_academics_directory_seo_title();
    $description = beyond_academics_directory_seo_description(count($competitions));
    $site_name = get_bloginfo('name');

    // Meta and social tags are skipped when a dedicated SEO plugin already manages them.
    if (!beyond_academics_directory_has_seo_plugin()) {
        echo '<meta name="description" content="' . esc_attr($description) . '" />' . "\n";
        echo '<meta property="og:type" content="article" />' . "\n";
        echo '<meta property="og:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta property="og:description" content="' . esc_attr($description) . '" />' . "\n";
        echo '<meta property="og:url" content="' . esc_url($url) . '" />' . "\n";
        echo '<meta property="og:site_name" content="' . esc_attr($site_name) . '" />' . "\n";
        echo '<meta name="twitter:card" content="summary" />' . "\n";
        echo '<meta name="twitter:title" content="' . esc_attr($title) . '" />' . "\n";
        echo '<meta name="twitter:description" content="' . esc_attr($description) . '" />' . "\n";
    }

    $items = array();
    foreach ($competitions as $index => $competition) {
        $item = array('@type' => 'ListItem', 'position' => $index + 1, 'name' => $competition['name']);
        if ($competition['url'] !== '') {
            $item['url'] = $competition['url'];
        }
        $items[] = $item;
    }

    $graph = array(
        '@context' => 'https://schema.org',
        '@graph' => array(
            array(
                '@type' => 'CollectionPage',
                '@id' => $url . '#webpage',
                'url' => $url,
                'name' => $title,
                'description' => $description,
                'inLanguage' => get_bloginfo('language'),
                'datePublished' => get_the_date('c', $post),
                'dateModified' => get_the_modified_date('c', $post),
                'isPartOf' => array('@type' => 'WebSite', 'name' => $site_name, 'url' => home_url('/')),
                'breadcrumb' => array('@id' => $url . '#breadcrumb'),
                'mainEntity' => array('@id' => $url . '#competitions'),
            ),
            array(
                '@type' => 'BreadcrumbList',
                '@id' => $url . '#breadcrumb',
                'itemListElement' => array(
                    array('@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url('/')),
                    array('@type' => 'ListItem', 'position' => 2, 'name' => 'Beyond Academics', 'item' => $url),
                ),
            ),
            array(
                '@type' => 'ItemList',
                '@id' => $url . '#competitions',
                'name' => 'STEM competitions directory',
                'numberOfItems' => count($items),
                'itemListElement' => $items,
            ),
        ),
    );

    echo '<script type="application/ld+json">' . wp_json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . '</script>' . "\n";
}
add_action('wp_head', 'beyond_academics_directory_head_seo', 5);

function beyond_academics_directory_unique_values($items, $field) {
    $values = array();
    foreach ($items as $item) {
        $value = trim((string) ($item[$field] ?? ''));
        if ($value !== '' && !in_array($value, $values, true)) {
            $values[] = $value;
        }
    }
    return $values;
}

function beyond_academics_directory_scope($level) {
    $level = strtolower($level);
    if (strpos($level, 'national') !== false && strpos($level, 'international') !== false) {
        return 'progression';
    }
    if (strpos($level, 'international') !== false) {
        return 'international';
    }
    if (strpos($level, 'national') !== false) {
        return 'national';
    }
    return 'other';
}

function beyond_academics_directory_participation($format) {
    $format = strtolower($format);
    $individual = strpos($format, 'individual') !== false;
    $team = strpos($format, 'team') !== false;
    if ($individual && $team) {
        return 'both';
    }
    if ($individual) {
        return 'individual';
    }
    if ($team) {
        return 'team';
    }
    return 'unspecified';
}

function beyond_academics_directory_filter_controls($prefix, $categories, $grades) {
    $html = '<div class="beyond-academics-finder-grid" data-filter-form="' . esc_attr($prefix) . '">';
    $html .= '<div class="beyond-academics-field beyond-academics-search-field"><label for="' . esc_attr($prefix) . '-search">Search</label><input id="' . esc_attr($prefix) . '-search" type="search" placeholder="Name, interest, category, or format" autocomplete="off" /></div>';
    $html .= '<div class="beyond-academics-field"><label for="' . esc_attr($prefix) . '-domain">Domain</label><select id="' . esc_attr($prefix) . '-domain"><option value="all">All domains</option>';
    foreach ($categories as $category) {
        $slug = sanitize_title($category['title']);
        $html .= '<option value="' . esc_attr($slug) . '">' . esc_html(preg_replace('/^[^\p{L}\p{N}]+/u', '', $category['title'])) . '</option>';
    }
    $html .= '</select></div><div class="beyond-academics-field"><label for="' . esc_attr($prefix) . '-grade">Age</label><select id="' . esc_attr($prefix) . '-grade"><option value="all">All listed ages</option>';
    foreach ($grades as $grade) {
        $html .= '<option value="' . esc_attr(strtolower($grade)) . '">' . esc_html($grade) . '</option>';
    }
    $html .= '</select></div><div class="beyond-academics-field"><label for="' . esc_attr($prefix) . '-scope">Scope</label><select id="' . esc_attr($prefix) . '-scope"><option value="all">All scopes</option><option value="national">National</option><option value="progression">National to International</option><option value="international">International</option><option value="other">Other / not specified</option></select></div>';
    $html .= '<div class="beyond-academics-field"><label for="' . esc_attr($prefix) . '-format">Participation</label><select id="' . esc_attr($prefix) . '-format"><option value="all">Any format</option><option value="individual">Individual</option><option value="team">Team</option><option value="both">Individual or Team</option></select></div>';
    $html .= '<div class="beyond-academics-field"><label for="' . esc_attr($prefix) . '-difficulty">Difficulty Level</label><select id="' . esc_attr($prefix) . '-difficulty"><option value="all">All levels</option><option value="1">1 Star (Beginner)</option><option value="2">2 Star (Easy)</option><option value="3">3 Star (Intermediate)</option><option value="4">4 Star (Advanced)</option><option value="5">5 Star (Expert)</option></select></div>';
    $html .= '<div class="beyond-academics-field beyond-academics-actions-field"><button type="button" class="beyond-academics-secondary-button" data-clear-filters="' . esc_attr($prefix) . '">Clear filters</button></div></div>';
    return $html;
}

function beyond_academics_directory_practical_notes_html() {
    return <<<'HTML'
<aside class="beyond-academics-practical-notes">
    <p><strong>Quick tip:</strong> Choose a competition because it fits your skills and stretches them, not just because it is famous.</p>
    <h3>Put the guidance into practice</h3>
    <p>The handbook contrasts “we want to build a robot” with a problem-led idea: “we want to help elderly people who struggle to open jars.” Start with who is affected and why it matters, then research, prototype, and test.</p>
    <p><strong>One week before the event:</strong> do a readiness check. Revisit the rulebook and judging criteria, confirm the timeline, make sure the project has been tested, and check that every teammate can explain the full project in clear language.</p>
</aside>
HTML;
}

function beyond_academics_directory_student_letter_html() {
    return <<<'HTML'
<section class="beyond-academics-editorial beyond-academics-student-letter" id="student-letter">
    <p class="beyond-academics-kicker">A closing note</p>
    <h2>A Letter to Students</h2>
    <p>Dear student,</p>
    <p>You do not have to know everything before you begin. Choose a question that makes you curious, find a challenge that feels possible but not effortless, and take the first step. Your first idea may change when you test it. That is not failure; that is how learning works.</p>
    <p>Keep a record of what you try, what surprises you, and what you would change. Ask teammates for their ideas, make sure everyone can explain the project, and remember that a clear explanation is often stronger than complicated words.</p>
    <p>You may win, or you may not. Either way, the skills you practise, the problems you learn to solve, and the confidence you build belong to you. Keep making, keep asking questions, and let each challenge help you decide what you want to explore next.</p>
    <p>With encouragement,<br><strong>10xTechClub Team</strong></p>
</section>
HTML;
}

function beyond_academics_directory_spotlight_configs() {
    return array(
        array(
            'id' => 'drone-spotlight',
            'match' => 'drone',
            'image' => 'drone-flight.jpg',
            'alt' => 'A quadcopter drone hovering in flight against an overcast sky',
            'width' => 547,
            'height' => 365,
            'reversed' => false,
            'title' => 'Inside a Drone: What Students Learn',
            'intro' => 'Drone challenges bring aerodynamics, electronics, and software together in one machine. Explore the parts that students design, build, and program.',
            'hint' => 'Tap the glowing points to explore the drone',
            'hotspots' => array(
                array('x' => 24, 'y' => 42, 'title' => 'Rotors & propulsion', 'text' => 'Spinning propellers create lift. Students learn about thrust, aerodynamics, and how motor and propeller choices change flight time.'),
                array('x' => 56, 'y' => 44, 'title' => 'Camera & payload', 'text' => 'Cameras and sensors turn a flying frame into a tool for mapping, inspection, and autonomous missions.'),
                array('x' => 48, 'y' => 57, 'title' => 'Flight controller', 'text' => 'The onboard computer stabilises the drone and follows code. This is where programming and AI come into drone challenges.'),
                array('x' => 52, 'y' => 83, 'title' => 'Frame & landing gear', 'text' => 'A light, strong frame protects the electronics and carries the battery. Weight and balance decide how well a design flies.'),
            ),
        ),
        array(
            'id' => 'robotics-spotlight',
            'match' => 'robot',
            'image' => 'robotics-teamwork.jpg',
            'alt' => 'Students working together with screwdrivers to assemble and wire a small wheeled robot',
            'width' => 612,
            'height' => 407,
            'reversed' => true,
            'title' => 'Inside a Robot: Build, Wire, and Test',
            'intro' => 'Robotics challenges combine mechanics, electronics, and code, and they are won by teams that build together. Explore the parts students assemble, wire, and program.',
            'hint' => 'Tap the glowing points to explore the robot',
            'hotspots' => array(
                array('x' => 29, 'y' => 69, 'title' => 'Sensors', 'text' => 'Distance and obstacle sensors let a robot detect the world around it. Students learn how machines sense and react.'),
                array('x' => 33, 'y' => 20, 'title' => 'Arm & gripper', 'text' => 'Arms and grippers turn motion into tasks such as picking, placing, and sorting. Mechanical design and precision both matter.'),
                array('x' => 43, 'y' => 50, 'title' => 'Wiring & electronics', 'text' => 'Wires, controllers, and power connections link every part. Careful wiring and repeated testing prevent most last-minute failures.'),
                array('x' => 52, 'y' => 74, 'title' => 'Wheels & motors', 'text' => 'Motors and wheels set speed, grip, and control. Teams balance power, weight, and reliability.'),
            ),
        ),
    );
}

function beyond_academics_directory_spotlight_html($categories) {
    $html = '';
    foreach (beyond_academics_directory_spotlight_configs() as $config) {
        $match = null;
        foreach ($categories as $category) {
            if (stripos($category['title'], $config['match']) !== false) {
                $match = $category;
                break;
            }
        }
        if ($match === null) {
            continue;
        }

        $pins = '';
        $items = '';
        foreach ($config['hotspots'] as $index => $spot) {
            $pins .= '<button type="button" class="beyond-academics-hotspot" data-hotspot="' . $index . '" style="--x:' . (int) $spot['x'] . '%;--y:' . (int) $spot['y'] . '%" aria-label="' . esc_attr($spot['title']) . '" aria-pressed="false"><span></span></button>';
            $items .= '<li data-hotspot-panel="' . $index . '"><strong>' . esc_html($spot['title']) . '</strong><span>' . esc_html($spot['text']) . '</span></li>';
        }

        $image = plugin_dir_url(__FILE__) . 'assets/images/' . $config['image'];
        $html .= '<section class="beyond-academics-spotlight' . ($config['reversed'] ? ' is-reversed' : '') . '" id="' . esc_attr($config['id']) . '"><div class="beyond-academics-spotlight-media"><div class="beyond-academics-spotlight-photo" data-tilt><img src="' . esc_url($image) . '" alt="' . esc_attr($config['alt']) . '" width="' . (int) $config['width'] . '" height="' . (int) $config['height'] . '" loading="lazy" decoding="async" />' . $pins . '</div><p class="beyond-academics-spotlight-hint">' . esc_html($config['hint']) . '</p></div><div class="beyond-academics-spotlight-copy"><p class="beyond-academics-kicker">Spotlight</p><h2>' . esc_html($config['title']) . '</h2><p>' . esc_html($config['intro']) . '</p><ul class="beyond-academics-hotspot-list">' . $items . '</ul></div></section>';
    }
    return $html;
}

function beyond_academics_directory_domain_icons() {
    return array(
        'robot' => '<rect x="17" y="20" width="30" height="22" rx="5"/><circle cx="26" cy="31" r="2.6" fill="currentColor"/><circle cx="38" cy="31" r="2.6" fill="currentColor"/><path d="M27 37h10M32 20v-8M13 28v8M51 28v8M24 42v4M40 42v4M22 46h20v10H22z"/><circle cx="32" cy="10" r="2.5"/>',
        'science' => '<path d="M26 10h12M28 10v14L15 47a5 5 0 0 0 4.5 7.5h25A5 5 0 0 0 49 47L36 24V10M21 40h22"/><circle cx="29" cy="46" r="2"/><circle cx="37" cy="48" r="1.6"/>',
        'math' => '<path d="M13 24h38M24 24c0 12-2 19-7 24M40 24v17c0 5 2 7 7 6"/>',
        'code' => '<path d="M24 20L11 32l13 12M40 20l13 12-13 12M35 15l-6 34"/>',
        'ai' => '<rect x="19" y="19" width="26" height="26" rx="5"/><circle cx="32" cy="32" r="5"/><path d="M27 19v-7M37 19v-7M27 45v7M37 45v7M19 27h-7M19 37h-7M45 27h7M45 37h7"/>',
        'innovation' => '<path d="M24 41c-6-4-8-10-6-16a14 14 0 0 1 28 0c2 6 0 12-6 16v4H24zM26 51h12M28 57h8M32 18v10M27 23l5 5 5-5"/>',
        'entrepreneur' => '<path d="M10 54h44M16 54V42M27 54V34M38 54V28M49 54V22M11 34l14-10 9 6 15-14M41 16h8v8"/>',
        'space' => '<path d="M32 7c9 6 13 17 10 30H22C19 24 23 13 32 7zM22 37l-9 9 9-2M42 37l9 9-9-2M28 45l4 11 4-11"/><circle cx="32" cy="25" r="4.5"/>',
        'drone' => '<rect x="25" y="27" width="14" height="10" rx="3"/><path d="M25 29l-11-8M39 29l11-8M25 35l-11 8M39 35l11 8"/><ellipse cx="12" cy="19" rx="8" ry="2.6"/><ellipse cx="52" cy="19" rx="8" ry="2.6"/><ellipse cx="12" cy="45" rx="8" ry="2.6"/><ellipse cx="52" cy="45" rx="8" ry="2.6"/>',
        'game' => '<path d="M17 24h30a9 9 0 0 1 9 8l2 11a6 6 0 0 1-10.5 4L43 41H21l-4.5 6A6 6 0 0 1 6 43l2-11a9 9 0 0 1 9-8zM22 28v9M17.5 32.5h9"/><circle cx="41" cy="31" r="2"/><circle cx="47" cy="36" r="2"/>',
        'national' => '<path d="M21 12h22v16a11 11 0 0 1-22 0zM21 17h-8c0 9 3 12 9 13M43 17h8c0 9-3 12-9 13M32 39v9M23 54h18M26 48h12"/>',
    );
}

function beyond_academics_directory_domain_icon_key($title) {
    $title = strtolower($title);
    $map = array('robot' => 'robot', 'science' => 'science', 'math' => 'math', 'coding' => 'code', 'artificial' => 'ai', 'innovation' => 'innovation', 'entrepreneur' => 'entrepreneur', 'space' => 'space', 'drone' => 'drone', 'game' => 'game', 'national' => 'national');
    foreach ($map as $needle => $key) {
        if (strpos($title, $needle) !== false) {
            return $key;
        }
    }
    return 'national';
}

function beyond_academics_directory_domain_gallery_html($categories) {
    $icons = beyond_academics_directory_domain_icons();
    $cards = '';
    foreach ($categories as $category) {
        $name = preg_replace('/^[^\p{L}\p{N}]+/u', '', $category['title']);
        $icon = $icons[beyond_academics_directory_domain_icon_key($category['title'])];
        $cards .= '<a class="beyond-academics-domain-card" href="#master-directory" data-domain-filter="' . esc_attr(sanitize_title($category['title'])) . '"><span class="beyond-academics-domain-icon"><svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' . $icon . '</svg></span><span class="beyond-academics-domain-name">' . esc_html($name) . '</span><span class="beyond-academics-domain-count">' . count($category['competitions']) . ' competitions</span></a>';
    }
    return '<section class="beyond-academics-domain-gallery" id="domain-gallery"><div class="beyond-academics-section-heading"><p class="beyond-academics-kicker">Explore by interest</p><h2>STEM Competition Domains at a Glance</h2><p>From robots and rockets to code and startups, choose a domain to jump to its competitions in the master directory.</p></div><div class="beyond-academics-domain-grid">' . $cards . '</div></section>';
}

function beyond_academics_directory_normalize_grade($value) {
    $value = trim(preg_replace('/\s+/', ' ', (string) $value));
    $value = preg_replace('/\s*\/\s*/', ' & ', $value);
    return preg_replace('/(?<=[A-Za-z])\s*–\s*(?=[A-Za-z])/u', ' & ', $value);
}

function beyond_academics_directory_age_group_names() {
    return array('Ages 6–12', 'Ages 13–18', 'Ages 18+', 'Open / varies');
}

function beyond_academics_directory_age_span($label) {
    if (preg_match('/^Grades (\d+)–(\d+)$/u', $label, $m)) {
        return array((int) $m[1] + 5, (int) $m[2] + 6);
    }
    if (preg_match('/^(\d+)–(\d+) Years$/u', $label, $m)) {
        return array((int) $m[1], (int) $m[2]);
    }
    if (preg_match('/^Under (\d+)–University$/u', $label, $m)) {
        return array((int) $m[1] - 2, 24);
    }
    if (preg_match('/^Students under (\d+)$/u', $label, $m)) {
        return array(5, (int) $m[1] - 1);
    }
    if (preg_match('/^Class (\d+)$/u', $label, $m)) {
        return array((int) $m[1] + 5, (int) $m[1] + 6);
    }
    if ($label === 'K–12' || $label === 'School Students (up to Class 12)') {
        return array(5, 18);
    }
    $spans = array(
        '16+ & University & Open' => array(16, 24),
        'Elementary' => array(5, 11),
        'Middle School' => array(11, 14),
        'High School' => array(14, 18),
        'College' => array(18, 24),
        'University' => array(18, 24),
        'School' => array(5, 18),
        'School Students' => array(5, 18),
        'Students' => array(5, 24),
        'Youth' => array(13, 24),
        'Primary & High School' => array(5, 18),
        'Elementary & Middle School' => array(5, 14),
        'Middle & High School' => array(11, 18),
        'Middle School & University' => array(11, 24),
        'High School & University' => array(14, 24),
        'School & College' => array(5, 24),
        'School & University' => array(5, 24),
        'School & Professional' => array(5, 24),
        'University & Recent Graduates' => array(18, 24),
        'Students & Professionals' => array(13, 24),
        'Students & Young Innovators' => array(5, 24),
    );
    return isset($spans[$label]) ? $spans[$label] : null;
}

function beyond_academics_directory_age_groups($label) {
    if ($label === 'Open' || $label === 'Varies') {
        return beyond_academics_directory_age_group_names();
    }
    $span = beyond_academics_directory_age_span($label);
    if ($span === null) {
        return array();
    }
    $bands = array('Ages 6–12' => array(6, 12), 'Ages 13–18' => array(13, 18), 'Ages 18+' => array(18, 24));
    $groups = array();
    foreach ($bands as $group => $range) {
        if ($span[0] <= $range[1] && $span[1] >= $range[0]) {
            $groups[] = $group;
        }
    }
    return $groups;
}



function beyond_academics_directory_register_suggestion_type() {
    register_post_type('ba_suggestion', array(
        'labels' => array(
            'name' => 'Competition suggestions',
            'singular_name' => 'Competition suggestion',
            'menu_name' => 'Competition suggestions',
        ),
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_icon' => 'dashicons-lightbulb',
        'supports' => array('title', 'editor'),
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'capabilities' => array('create_posts' => 'do_not_allow'),
    ));
}
add_action('init', 'beyond_academics_directory_register_suggestion_type');

function beyond_academics_directory_suggestion_messages() {
    return array(
        'sent' => array('success', 'Thank you! We have received your suggestion and will review it.'),
        'invalid' => array('error', 'Please add the competition name and a valid website link that starts with http:// or https://.'),
        'expired' => array('error', 'This form expired. Please try again.'),
        'limit' => array('error', 'Too many suggestions from this connection. Please try again later.'),
        'error' => array('error', 'Something went wrong while saving your suggestion. Please try again.'),
    );
}

function beyond_academics_directory_handle_suggestion() {
    $redirect = home_url('/');
    if (isset($_POST['ba_redirect']) && is_string($_POST['ba_redirect'])) {
        $redirect = wp_validate_redirect(esc_url_raw(wp_unslash($_POST['ba_redirect'])), $redirect);
    }
    $redirect = remove_query_arg('ba_suggestion', $redirect);
    $finish = function ($status) use ($redirect) {
        wp_safe_redirect(add_query_arg('ba_suggestion', $status, $redirect) . '#suggest-a-competition');
        exit;
    };
    $field = function ($key) {
        return (isset($_POST[$key]) && is_string($_POST[$key])) ? wp_unslash($_POST[$key]) : '';
    };

    if (!wp_verify_nonce(sanitize_text_field($field('ba_nonce')), 'beyond_academics_suggest')) {
        $finish('expired');
    }

    // Bots fill the hidden field; pretend it worked and store nothing.
    if ($field('ba_hp') !== '') {
        $finish('sent');
    }

    $ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
    $limit_key = 'ba_suggest_' . md5($ip);
    $attempts = (int) get_transient($limit_key);
    if ($attempts >= 5) {
        $finish('limit');
    }
    set_transient($limit_key, $attempts + 1, HOUR_IN_SECONDS);

    $name = mb_substr(sanitize_text_field($field('ba_name')), 0, 200);
    $link = esc_url_raw(trim($field('ba_link')), array('http', 'https'));
    $domain = mb_substr(sanitize_text_field($field('ba_domain')), 0, 120);
    $age = mb_substr(sanitize_text_field($field('ba_age')), 0, 100);
    $participation = mb_substr(sanitize_text_field($field('ba_participation')), 0, 60);
    $details = mb_substr(sanitize_textarea_field($field('ba_details')), 0, 2000);
    $contact_name = mb_substr(sanitize_text_field($field('ba_contact_name')), 0, 120);
    $contact_email = sanitize_email($field('ba_contact_email'));

    if ($name === '' || $link === '') {
        $finish('invalid');
    }

    $content = "Competition: " . $name
        . "\nWebsite: " . $link
        . "\nDomain: " . ($domain !== '' ? $domain : 'Not given')
        . "\nAge or grade: " . ($age !== '' ? $age : 'Not given')
        . "\nParticipation: " . ($participation !== '' ? $participation : 'Not given')
        . "\n\nDetails:\n" . ($details !== '' ? $details : 'Not given')
        . "\n\nSubmitted by: " . ($contact_name !== '' ? $contact_name : 'Not given')
        . "\nEmail: " . ($contact_email !== '' ? $contact_email : 'Not given');

    $post_id = wp_insert_post(array(
        'post_type' => 'ba_suggestion',
        'post_status' => 'pending',
        'post_title' => $name,
        'post_content' => $content,
    ), true);
    if (is_wp_error($post_id)) {
        $finish('error');
    }

    $to = apply_filters('beyond_academics_suggestion_recipient', '10xtechclub@gmail.com');
    $headers = array();
    if (is_email($contact_email)) {
        $headers[] = 'Reply-To: ' . $contact_email;
    }
    wp_mail(
        $to,
        '[Beyond Academics] New competition suggestion: ' . $name,
        $content . "\n\nReview it in WordPress: " . admin_url('edit.php?post_type=ba_suggestion'),
        $headers
    );

    $finish('sent');
}
add_action('admin_post_nopriv_beyond_academics_suggest', 'beyond_academics_directory_handle_suggestion');
add_action('admin_post_beyond_academics_suggest', 'beyond_academics_directory_handle_suggestion');

function beyond_academics_directory_suggestion_form_html($categories) {
    $notice = '';
    if (isset($_GET['ba_suggestion']) && is_string($_GET['ba_suggestion'])) {
        $status = sanitize_key(wp_unslash($_GET['ba_suggestion']));
        $messages = beyond_academics_directory_suggestion_messages();
        if (isset($messages[$status])) {
            $notice = '<div class="beyond-academics-form-notice is-' . esc_attr($messages[$status][0]) . '" role="status">' . esc_html($messages[$status][1]) . '</div>';
        }
    }

    $domains = '';
    foreach ($categories as $category) {
        $name = preg_replace('/^[^\p{L}\p{N}]+/u', '', $category['title']);
        $domains .= '<option value="' . esc_attr($name) . '">' . esc_html($name) . '</option>';
    }

    $page_url = is_singular() ? get_permalink() : home_url('/');

    $html = '<section class="beyond-academics-editorial beyond-academics-suggest" id="suggest-a-competition">';
    $html .= '<p class="beyond-academics-kicker">Help us grow this handbook</p><h2>Know a Competition We Missed?</h2>';
    $html .= '<p>If you know a STEM, robotics, AI, coding, science, space, or innovation competition that is not listed in this handbook, share its link and details below. Our team will review your suggestion.</p>';
    $html .= $notice;
    $html .= '<form class="beyond-academics-suggest-form" method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    $html .= '<input type="hidden" name="action" value="beyond_academics_suggest" />';
    $html .= '<input type="hidden" name="ba_nonce" value="' . esc_attr(wp_create_nonce('beyond_academics_suggest')) . '" />';
    $html .= '<input type="hidden" name="ba_redirect" value="' . esc_url($page_url) . '" />';
    $html .= '<div class="beyond-academics-suggest-grid">';
    $html .= '<div class="beyond-academics-field"><label for="ba-name">Competition name <span aria-hidden="true">*</span></label><input id="ba-name" name="ba_name" type="text" maxlength="200" required /></div>';
    $html .= '<div class="beyond-academics-field"><label for="ba-link">Official website link <span aria-hidden="true">*</span></label><input id="ba-link" name="ba_link" type="url" placeholder="https://" maxlength="500" required /></div>';
    $html .= '<div class="beyond-academics-field"><label for="ba-domain">Domain</label><select id="ba-domain" name="ba_domain"><option value="">Not sure</option>' . $domains . '<option value="Other">Other</option></select></div>';
    $html .= '<div class="beyond-academics-field"><label for="ba-age">Age or grade</label><input id="ba-age" name="ba_age" type="text" placeholder="For example: Grades 7–12 or ages 13–18" maxlength="100" /></div>';
    $html .= '<div class="beyond-academics-field"><label for="ba-participation">Participation</label><select id="ba-participation" name="ba_participation"><option value="">Not sure</option><option value="Individual">Individual</option><option value="Team">Team</option><option value="Individual or Team">Individual or Team</option></select></div>';
    $html .= '<div class="beyond-academics-field"><label for="ba-contact-name">Your name (optional)</label><input id="ba-contact-name" name="ba_contact_name" type="text" maxlength="120" autocomplete="name" /></div>';
    $html .= '<div class="beyond-academics-field beyond-academics-field-wide"><label for="ba-details">Details about the competition</label><textarea id="ba-details" name="ba_details" rows="5" maxlength="2000" placeholder="Who can take part, what the competition involves, when it usually runs, or anything else that would help us."></textarea></div>';
    $html .= '<div class="beyond-academics-field beyond-academics-field-wide"><label for="ba-contact-email">Your email (optional)</label><input id="ba-contact-email" name="ba_contact_email" type="email" maxlength="200" autocomplete="email" /></div>';
    $html .= '</div>';
    $html .= '<div class="beyond-academics-hp" aria-hidden="true"><label>Leave this field empty<input name="ba_hp" type="text" tabindex="-1" autocomplete="off" /></label></div>';
    $html .= '<button type="submit" class="beyond-academics-primary-button">Send suggestion</button>';
    $html .= '<p class="beyond-academics-form-note">Name and email are optional and only used if we need to follow up about your suggestion.</p>';
    $html .= '</form></section>';
    return $html;
}

function beyond_academics_directory_cta_html() {
    return '<section class="beyond-academics-cta" id="next-step"><span class="beyond-academics-cta-icon"><svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M32 7c9 6 13 17 10 30H22C19 24 23 13 32 7zM22 37l-9 9 9-2M42 37l9 9-9-2M28 45l4 11 4-11"/><circle cx="32" cy="25" r="4.5"/></svg></span><div class="beyond-academics-cta-copy"><h2>Give Your Child the Preparation to Compete</h2><p>Discovering a competition is exciting—but turning that ambition into a working project takes preparation, practice, and the right guidance.</p><p>Through our <strong>Premier Accelerator Program (PAP)</strong> for students aged 12–17, 10xTechClub helps learners progress from technology concepts to building projects, experimenting with ideas, and tackling practical challenges. With exposure to Robotics, AI, Python, IoT, and Embedded Systems, alongside mentor guidance and soft skills development, students can build relevant experience for robotics competitions, coding challenges, hackathons, and innovation programs.</p><p>Rather than preparing only for a single event, students develop skills they can apply across multiple challenges—learning to build, test, improve, and present their ideas with confidence.</p><p><strong>Help your child take the next step from aspiring competitor to confident creator.</strong></p><p><a href="https://10xtechclub.com/" target="_blank" rel="noopener noreferrer">Visit 10xTechClub</a></p></div></section>';
}

function beyond_academics_directory_level_badges($levels) {
    if (empty($levels)) {
        return '<span class="beyond-academics-link-placeholder">Not listed in source</span>';
    }
    $html = array();
    foreach ($levels as $level) {
        $html[] = '<span class="beyond-academics-level beyond-academics-level-' . beyond_academics_directory_scope($level) . '">' . esc_html($level) . '</span>';
    }
    return implode(' ', $html);
}

function beyond_academics_directory_shortcode() {
    $categories = beyond_academics_directory_parse_markdown();
    if (empty($categories)) {
        return '<div class="beyond-academics-directory"><p>Competition data could not be loaded. Upload the source markdown file to the plugin data folder or the uploads folder.</p></div>';
    }

    wp_enqueue_style('beyond-academics-directory-style');
    wp_enqueue_script('beyond-academics-directory-script');

    $category_descriptions = array(
        '🤖 Robotics & Engineering' => 'These hands-on challenges bring engineering, programming, electronics, and teamwork together. Students design, build, and test robots or engineered systems, from beginner activities to advanced autonomous and marine robotics.',
        '🔬 Science & Research' => 'Students develop a question, investigate it, and communicate findings through research presentations and science fairs. Topics in this directory include environmental, water, earth, and broader STEM research.',
        '📚 Mathematics & Olympiads' => 'Olympiads challenge logic, patterns, and mathematical reasoning rather than calculation speed. The listings include school-level contests and advanced national-to-international pathways.',
        '💻 Coding & Computational Thinking' => 'These contests range from computational-thinking puzzles and programming contests to software challenges. Students practise algorithms, coding fluency, and problem-solving individually or in teams.',
        '🧠 Artificial Intelligence' => 'AI competitions ask students to understand and apply intelligent systems, not just use AI tools. The handbook includes machine learning, AI projects, and social-impact applications, from school challenges to university programmes.',
        '💡 Innovation & Design' => 'Students start with a real-world problem, then develop and test a practical design or invention. Topics span product design, sustainability, engineering, social impact, and innovation pitches.',
        '💼 Entrepreneurship' => 'Entrepreneurship challenges help students shape ideas into ventures through business planning, market strategy, and pitching. The handbook includes school, college, technology, and social-enterprise pathways.',
        '🚀 Space & Astronomy' => 'These opportunities explore space science and engineering through satellite and CanSat design, model rocketry, space robotics, astronomy, and software. They range from school education programmes to advanced engineering challenges.',
        '🛸 Drones & Autonomous Systems' => 'Drone and autonomous-system competitions combine aerodynamics, electronics, software, and AI. Students may design aircraft or UAV systems, build autonomous missions, or take part in piloting and racing events.',
        '🎮 Game Development & Interactive Technology' => 'Game-development competitions bring together code, art, mechanics, and storytelling to create interactive experiences. Formats range from short game jams to student showcases and engine-specific challenges.',
        '🎓 National & Academic Competitions' => "This section brings together national initiatives and academic or leadership competitions run by Indian bodies, institutions, and global programmes. Entries include hackathons, innovation challenges, Olympiad pathways, academic debate, and Model UN; check each event's own eligibility and scope.",
    );

    $unique_entries = array();
    $grade_options = array();
    $category_toc = '';
    foreach ($categories as $category) {
        $title = $category['title'];
        $category_slug = sanitize_title($title);
        $category_toc .= '<li><a href="#' . esc_attr($category_slug) . '">' . esc_html(preg_replace('/^[^\p{L}\p{N}]+/u', '', $title)) . '<span>' . count($category['competitions']) . ' entries</span></a></li>';

        foreach ($category['competitions'] as $competition) {
            $competition['category_title'] = $title;
            $competition['grades'] = beyond_academics_directory_normalize_grade($competition['grades']);
            $key = strtolower(trim($competition['name']));
            if (!isset($unique_entries[$key])) {
                $unique_entries[$key] = array(
                    'name' => $competition['name'],
                    'appearances' => array(),
                    'categories' => array(),
                );
            }
            $unique_entries[$key]['appearances'][] = $competition;
            $unique_entries[$key]['categories'][$category_slug] = $title;

            foreach (beyond_academics_directory_age_groups(trim($competition['grades'])) as $grade) {
                if ($grade !== '' && !in_array($grade, $grade_options, true)) {
                    $grade_options[] = $grade;
                }
            }
        }
    }
    $grade_options = array_values(array_intersect(beyond_academics_directory_age_group_names(), $grade_options));

    $master_rows = '';
    foreach ($unique_entries as $entry) {
        $appearances = $entry['appearances'];
        $domains = array_values($entry['categories']);
        $levels = beyond_academics_directory_unique_values($appearances, 'level');
        $grades = beyond_academics_directory_unique_values($appearances, 'grades');
        $grade_keys = array();
        foreach ($appearances as $appearance) {
            foreach (beyond_academics_directory_age_groups($appearance['grades']) as $key) {
                if (!in_array($key, $grade_keys, true)) {
                    $grade_keys[] = $key;
                }
            }
        }
        $formats = beyond_academics_directory_unique_values($appearances, 'format');
        $difficulties = beyond_academics_directory_unique_values($appearances, 'difficulty');
        $best_for = array();
        foreach ($appearances as $appearance) {
            if ($appearance['best_for'] !== '') {
                $best_for[] = preg_replace('/^[^\p{L}\p{N}]+/u', '', $appearance['category_title']) . ': ' . $appearance['best_for'];
            }
        }
        $best_for = array_values(array_unique($best_for));
        $websites = beyond_academics_directory_unique_values($appearances, 'official_website');
        $domain_slugs = array_keys($entry['categories']);
        $scopes = array_unique(array_map('beyond_academics_directory_scope', $levels));
        $participation = array_unique(array_map('beyond_academics_directory_participation', $formats));
        $difficulty_numbers = array_unique(array_map(function ($value) {
            return (string) substr_count($value, '⭐');
        }, $difficulties));
        $search_text = strtolower(implode(' ', array_merge(array($entry['name']), $domains, $levels, $grades, $formats, $difficulties, $best_for)));
        $attributes = ' data-search="' . esc_attr($search_text) . '" data-domains="' . esc_attr(implode('|', $domain_slugs)) . '" data-grades="' . esc_attr(strtolower(implode('|', $grade_keys))) . '" data-scopes="' . esc_attr(implode('|', $scopes)) . '" data-formats="' . esc_attr(implode('|', $participation)) . '" data-difficulties="' . esc_attr(implode('|', $difficulty_numbers)) . '"';
        $cell = function ($values) {
            return empty($values) ? '<span class="beyond-academics-link-placeholder">Not listed in source</span>' : implode('<br>', array_map('esc_html', $values));
        };

        $official_links = '';
        foreach ($websites as $website) {
            if (preg_match('/^https?:\/\//i', $website)) {
                $official_links .= '<a href="' . esc_url($website) . '" target="_blank" rel="noopener noreferrer">Official site</a><br>';
            }
        }
        if ($official_links === '') {
            $official_links = '<span class="beyond-academics-link-placeholder">Not listed in source</span>';
        }

        $master_rows .= '<tr' . $attributes . '><th scope="row" data-label="Competition">' . esc_html($entry['name']) . '</th><td data-label="Scope / level">' . beyond_academics_directory_level_badges($levels) . '</td><td data-label="Age">' . $cell($grades) . '</td><td data-label="Format">' . $cell($formats) . '</td><td data-label="Difficulty Level">' . $cell($difficulties) . '</td><td data-label="Domain">' . $cell($best_for) . '</td><td data-label="Official website">' . $official_links . '</td></tr>';
    }

    $page_html = '<div class="beyond-academics-directory" id="top">';
    $page_html .= '<header class="beyond-academics-hero"><div class="beyond-academics-hero-copy"><p class="beyond-academics-kicker">10xTechClub · Parent and student handbook</p><h1>Beyond Academics</h1><p class="beyond-academics-subtitle">A Categorized list of National and International Competitions</p><p class="beyond-academics-intro">A Parent\'s Guide to STEM, Robotics, AI, Coding, Science, Engineering, Space &amp; Innovation Competitions.</p><a href="#handbook-directory" class="beyond-academics-primary-button">Browse the handbook</a></div><figure class="beyond-academics-hero-figure"><img src="' . esc_url(plugin_dir_url(__FILE__) . 'assets/images/hero-robot.png') . '" alt="A wheeled robot with ultrasonic sensors and control boards, with a robotic arm and tools on the workbench behind it" width="1627" height="967" loading="lazy" decoding="async" /></figure></header>'
    $page_html .= '<details class="beyond-academics-toc" id="handbook-directory" open><summary><span><small>CONTENTS</small>Handbook directory</span><span class="beyond-academics-toc-toggle" aria-hidden="true">+</span></summary><ol class="beyond-academics-toc-list"><li><a href="#introduction">Why this handbook exists</a></li><li><a href="#stem-journey">The Four Stages of a STEM Journey</a></li><li><a href="#domain-gallery">STEM Competition Domains at a Glance</a></li><li><a href="#competition-categories">Competition Categories</a><ul class="beyond-academics-toc-sub">' . $category_toc . '</ul></li><li><a href="#finding-the-right-fit">Finding the Right Fit</a></li><li><a href="#master-directory">Master Competition Directory <span>' . count($unique_entries) . ' unique competitions</span></a></li><li><a href="#how-to-succeed">How to Actually Succeed</a></li><li><a href="#designing-the-journey">Designing the Journey, Not Just Entering Events</a></li><li><a href="#student-letter">A Letter to Students</a></li></ol></details>';

    $page_html .= '<section class="beyond-academics-intro-section" id="introduction"><p class="beyond-academics-kicker">Dear Parent</p><h2>Why this handbook exists</h2><p>For decades, academic success has been measured by marks, ranks, and report cards. That still matters, but the world has quietly changed. Universities, employers, and innovators are now looking beyond grades, for curiosity, creativity, initiative, resilience, and the ability to solve real problems.</p><p>Those qualities aren\'t built by textbooks alone. They\'re built by robots that don\'t work the first time, by presenting ideas in front of judges, by writing code to solve real problems, by launching rockets and designing drones and pitching startup ideas.</p><p>Yet despite thousands of STEM competitions available across India and the world, most parents know only a handful, not because they aren\'t interested, but because information is scattered across hundreds of organisations, government initiatives, and private institutions.</p><p>That\'s what this guide is for: not to encourage your child to enter every competition, but to help you find the right ones based on their interests, strengths, and stage.</p><p>You don\'t need to read from beginning to end. Start with the contents, choose the category that matches your child\'s interest, compare a few options, and shortlist those that feel exciting and achievable. The goal isn\'t to enter the most competitions; it\'s to enter the right ones.</p></section>';

    $page_html .= '<section class="beyond-academics-editorial beyond-academics-about" id="about-10xtechclub"><h2>What Is 10xTechClub?</h2><p>10xTechClub is a hands-on STEM learning and technology education centre in Pune, India, empowering students to explore emerging technologies, build real-world projects, and develop future-ready skills. Through experiential, project-based learning, students explore Robotics, Artificial Intelligence (AI), Coding, Electronics, Python, 3D Printing, IoT, SpaceTech, and other exciting fields of innovation.</p><p>At 10xTechClub, learning goes beyond textbooks. Students are encouraged to experiment, solve problems, collaborate, design prototypes, participate in hackathons, and turn their ideas into working projects. With structured learning pathways, mentor guidance, and opportunities to apply their knowledge, students develop critical thinking, creativity, teamwork, and an innovation-driven mindset.</p><p>We believe that every curious learner deserves opportunities to explore their potential beyond the classroom. That is why Beyond Academics: The Ultimate STEM Competition Handbook brings together a curated guide to STEM, robotics, science, AI, coding, engineering, space, and innovation competitions in India and around the world. Designed for students of age 6–19 years and above, parents, and educators, this resource helps readers discover opportunities, understand competition pathways, and explore ways to turn curiosity and practical skills into meaningful learning experiences.</p><p>Whether a student is taking their first steps into robotics or aspiring to participate in national and international innovation challenges, this handbook is a starting point for exploring what is possible beyond academics.</p></section>';

    $page_html .= '<section class="beyond-academics-editorial beyond-academics-journey" id="stem-journey"><p class="beyond-academics-kicker">The STEM journey</p><h2>The Four Stages of a STEM Journey</h2><p>Every meaningful STEM journey tends to follow a similar arc. The directory is organised so you can find where your child fits right now and see where they could go next.</p><ol class="beyond-academics-stages"><li><strong>Explore</strong><span>Try different fields with low-pressure, beginner-friendly competitions.</span></li><li><strong>Build</strong><span>Go deeper into one or two areas and build real projects.</span></li><li><strong>Compete</strong><span>Enter more advanced, selective competitions.</span></li><li><strong>Innovate</strong><span>Apply skills to original ideas, mentorship, and real-world impact.</span></li></ol><p><a href="#handbook-directory">Back to handbook directory</a></p></section>';

    $page_html .= beyond_academics_directory_domain_gallery_html($categories);
    $page_html .= '<section class="beyond-academics-category-collection" id="competition-categories"><div class="beyond-academics-section-heading"><h2>Competition Categories</h2><p>These categories follow the handbook\'s domain groupings. Read each summary to see what students do in that domain.</p></div>';
    foreach ($categories as $category) {
        $title = $category['title'];
        $slug = sanitize_title($title);
        $description = $category_descriptions[$title] ?? '';
        $page_html .= '<section class="beyond-academics-category-section" id="' . esc_attr($slug) . '"><div class="beyond-academics-section-heading"><h3><span class="beyond-academics-category-icon" aria-hidden="true"><svg viewBox="0 0 64 64" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">' . beyond_academics_directory_domain_icons()[beyond_academics_directory_domain_icon_key($title)] . '</svg></span>' . esc_html(preg_replace('/^[^p{L}p{N}]+/u', '', $title)) . '</h3><p>' . esc_html($description) . '</p></div></section>';
    }
    $page_html .= '</section>';

    $page_html .= '<section class="beyond-academics-editorial beyond-academics-fit" id="finding-the-right-fit"><p class="beyond-academics-kicker">Choose with purpose</p><h2>Finding the Right Fit</h2><div class="beyond-academics-table-wrapper"><table class="beyond-academics-table"><caption>Use interests as a starting point for exploring directory domains</caption><thead><tr><th scope="col">If your child enjoys...</th><th scope="col">Look at...</th></tr></thead><tbody><tr><th scope="row" data-label="Interest">Building robots or machines</th><td data-label="Explore">Robotics · Engineering · Drones</td></tr><tr><th scope="row" data-label="Interest">Programming and creating software</th><td data-label="Explore">Coding · Artificial Intelligence · Game Development</td></tr><tr><th scope="row" data-label="Interest">Solving puzzles and logical problems</th><td data-label="Explore">Mathematics Olympiads</td></tr><tr><th scope="row" data-label="Interest">Experimenting and asking “Why?”</th><td data-label="Explore">Science &amp; Research</td></tr><tr><th scope="row" data-label="Interest">Space and astronomy</th><td data-label="Explore">Space Competitions</td></tr><tr><th scope="row" data-label="Interest">Inventing and creating new ideas</th><td data-label="Explore">Innovation &amp; Design</td></tr><tr><th scope="row" data-label="Interest">Starting businesses or pitching ideas</th><td data-label="Explore">Entrepreneurship</td></tr><tr><th scope="row" data-label="Interest">Electronics and embedded systems</th><td data-label="Explore">Robotics · Engineering · Drones</td></tr><tr><th scope="row" data-label="Interest">Debating global issues or world affairs</th><td data-label="Explore">Academic Enrichment · Debate · Model United Nations</td></tr></tbody></table></div><h3>By experience level</h3><ul><li><strong>Beginner:</strong> FIRST LEGO League Explore, Bebras, INSPIRE MANAK, Minecraft Education, Brackeys Game Jam.</li><li><strong>Intermediate:</strong> WRO, Robotex, Codeavour, Technovation, IAAC.</li><li><strong>Advanced:</strong> FRC, IOAI, ISEF, RoboCup.</li></ul><h3>By goal</h3><p>Building a portfolio favours Robotics, AI, Research, and Entrepreneurship. University admissions favour Olympiads, Research, Robotics, and Debate. Leadership favours Robotics, Entrepreneurship, Innovation, and Model UN.</p><p>There’s no single “best” competition, only the one that’s right for your child today. A strong foundation built through beginner-friendly experiences almost always takes a student further than rushing into advanced competitions.</p><p><a href="#handbook-directory">Back to handbook directory</a></p></section>';

    $page_html .= beyond_academics_directory_spotlight_html($categories);

    $page_html .= '<section class="beyond-academics-directory-block" id="master-directory"><div class="beyond-academics-section-heading"><p class="beyond-academics-kicker">Search all domains</p><h2>Master Competition Directory</h2><p>One listing per unique competition name. Where the handbook repeats a competition across domains, its source-listed domains and “Best For” guidance are combined here. Choose a category in the filters to narrow the list.</p></div><div class="beyond-academics-directory-note"><strong>Source notes:</strong> Eligibility, format, level, difficulty, and “Best For” are shown only when present in the handbook. Difficulty is the guide\'s comparative rating, not an organiser rating. Cost and time commitment are not listed when the source does not provide them. Scope filters are derived from the source\'s level wording. This is a suggested list and does not imply endorsement of any competition.</div>' . beyond_academics_directory_filter_controls('master', $categories, $grade_options) . '<div class="beyond-academics-results-meta" id="master-count" aria-live="polite"></div><p class="beyond-academics-empty-state" id="master-empty" hidden>No competitions match these filters. Try a broader search or clear filters.</p><div class="beyond-academics-table-wrapper beyond-academics-master-table"><table class="beyond-academics-table"><caption>Unique competitions and source-provided details</caption><thead><tr><th scope="col">Competition</th><th scope="col">Scope / level</th><th scope="col">Age</th><th scope="col">Format</th><th scope="col">Difficulty Level</th><th scope="col">Domain</th><th scope="col">Official website</th></tr></thead><tbody>' . $master_rows . '</tbody></table></div><p class="beyond-academics-return"><a href="#handbook-directory">Back to handbook directory</a></p></section>';

    $page_html .= '<section class="beyond-academics-download" id="download-directory"><span class="beyond-academics-download-icon"><svg viewBox="0 0 64 64" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 8h20l10 10v38H18zM38 8v10h10M32 28v14M26 36l6 6 6-6"/></svg></span><div class="beyond-academics-download-copy"><p class="beyond-academics-kicker">Free download</p><h2>Take the Directory With You</h2><p>Download a printable PDF of this categorized list of national and international competitions, with levels, ages, formats, difficulty, and official websites for each one.</p><p class="beyond-academics-download-meta">PDF · 13 pages · about 145 KB</p></div><a class="beyond-academics-primary-button beyond-academics-download-button" href="' . esc_url(plugin_dir_url(__FILE__) . 'assets/downloads/STEM-Competition-Directory.pdf') . '" download="STEM-Competition-Directory.pdf">Download PDF</a></section>';

    $page_html .= '<section class="beyond-academics-editorial beyond-academics-success" id="how-to-succeed"><p class="beyond-academics-kicker">Prepare thoughtfully</p><h2>How to Actually Succeed</h2><p>Discovering the right competition is only step one. Here’s what separates students who thrive from students who just participate.</p><ol><li><strong>Understand the Format Before You Commit.</strong> Know what’s being evaluated, whether it matches your child’s current level, and what the timeline looks like. Read the rulebook first; it tells you what judges expect. Choose a competition because it fits your child’s skills and stretches them, not just because it’s famous.</li><li><strong>Think Like a Judge.</strong> Judges evaluate the process, not just the final result. Explain how the problem was identified, how decisions were made, and what was learned. Practise explaining the project to someone with zero context; clarity beats complexity.</li><li><strong>Build Projects That Stand Out.</strong> Start with a real problem, who it affects, and why it matters. Then research, prototype, and test. A strong project solves a meaningful problem, not just showcases technology.</li><li><strong>Build as a Team, Not a Group of Individuals.</strong> Divide roles clearly but make sure everyone understands the whole project. Communicate regularly, not just before deadlines.</li><li><strong>Document as You Go.</strong> Record what was tried, what failed, what changed, and why. This makes presentations easier, strengthens judging, and builds a portfolio.</li><li><strong>Present Like You’re Having a Conversation.</strong> Speak naturally and show real understanding. Tell the story behind the project instead of reciting a memorised script.</li><li><strong>Avoid the Predictable Mistakes.</strong> Start early, read the rulebook, research before building, test more than once, and focus on learning as well as winning. Do a readiness check a week before the event.</li><li><strong>Think Beyond the Competition Itself.</strong> Refine good projects and enter them elsewhere. At the start of each year, plan skills, competitions, mentors, and documentation, then review that plan every six months.</li></ol><p><a href="#handbook-directory">Back to handbook directory</a></p></section>';

    $page_html .= '<section class="beyond-academics-editorial beyond-academics-closing" id="designing-the-journey"><p class="beyond-academics-kicker">Keep learning beyond the event</p><h2>Designing the Journey, Not Just Entering Events</h2><p>Instead of asking which competition to enter next, ask what your child hopes to achieve this year. Progress comes from each experience building on the last, not from the number of events entered.</p><p>Setbacks are part of the process. Treat them as a lesson: what worked, what didn’t, and what to try differently next time. A “Lessons Learned” notebook can do more for long-term growth than a trophy.</p><p>Measure success by the skills your child develops, not the certificates they collect. Confidence, curiosity, resilience, and problem-solving last long after any competition ends. The best STEM journey isn’t planned in a single day. It’s built one challenge at a time.</p></section>';
    $page_html .= '<footer class="beyond-academics-disclaimer"><h2>Disclaimer</h2><p><em>Please note: This is a curated informational list of potential competition opportunities, not an endorsement by 10xTechClub. Competition details may change; always verify eligibility, dates, fees, and rules on the official competition website before participating.</em></p><p><a href="#handbook-directory">Back to handbook directory</a></p><a href="#top" class="beyond-academics-back-top" aria-label="Back to top">Back to top ↑</a></footer>' . beyond_academics_directory_suggestion_form_html($categories) . '</div>';

    $marker = 'then review that plan every six months.</li></ol><p><a href="#handbook-directory">Back to handbook directory</a></p></section>';
    $expanded_tips = 'then review that plan every six months.</li></ol>' . beyond_academics_directory_practical_notes_html() . '</section>';
    $page_html = str_replace($marker, $expanded_tips, $page_html);
    $page_html = str_replace('<footer class="beyond-academics-disclaimer">', beyond_academics_directory_student_letter_html() . beyond_academics_directory_cta_html() . '<footer class="beyond-academics-disclaimer">', $page_html);

    return $page_html;
}
add_shortcode('beyond_academics_directory', 'beyond_academics_directory_shortcode');

function beyond_academics_directory_create_page() {
    $slug = 'beyond-academics';
    $page = get_page_by_path($slug);
    if ($page instanceof WP_Post) {
        return;
    }

    wp_insert_post(array(
        'post_title' => 'Beyond Academics',
        'post_name' => $slug,
        'post_content' => '[beyond_academics_directory]',
        'post_status' => 'publish',
        'post_type' => 'page',
        'comment_status' => 'closed',
    ));
}
register_activation_hook(__FILE__, 'beyond_academics_directory_create_page');
