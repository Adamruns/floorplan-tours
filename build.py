"""Bundle each plan into a single self-contained tour page.

dist/<plan>.html          artifact body (no doctype; the artifact host wraps it)
dist/preview/<plan>.html  the same body in a full document, for local testing
docs/                     static site for any host (GitHub Pages serves this folder): one folder per tour plus a landing page

three.js core loads from jsDelivr. The few three.js add-ons the engine uses are vendored in
vendor/ and inlined, so pages need no import map and no second CDN request.
"""

import html
import re
import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
SITE_DIRECTORY = ROOT / 'docs'
THREE_VERSION = '0.160.0'
THREE_IMPORT = f"import * as THREE from 'https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/build/three.module.min.js';"
ADDON_BASE_URL = f'https://cdn.jsdelivr.net/npm/three@{THREE_VERSION}/examples/jsm/'
ADDON_DIRECTORY = ROOT / f'vendor/three-{THREE_VERSION}'
ADDON_ENTRIES = {
    'EffectComposer': 'postprocessing/EffectComposer.js',
    'GTAOPass': 'postprocessing/GTAOPass.js',
    'OutputPass': 'postprocessing/OutputPass.js',
    'RenderPass': 'postprocessing/RenderPass.js',
    'RoundedBoxGeometry': 'geometries/RoundedBoxGeometry.js',
}
ENGINE_FILES = ['src/textures.js', 'src/furniture.js', 'src/tour.js']
IMPORT_PATTERN = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'([^']+)';", re.S)
EXPORT_PATTERN = re.compile(r'^export\s*\{([^}]*)\};\s*$', re.M)

PAGES = {
    'sussex': {
        'blurb': 'MAA 1225 · South End, Charlotte',
        'canvas_label': '3D model of the Sussex floor plan at MAA 1225',
        'description': 'Walkable, to-scale 3D tour of the MAA 1225 Sussex two-bedroom floor plan.',
        'loading': 'Framing the Sussex…',
        'name': 'Sussex',
        'plan': 'plans/sussex.js',
        'specs': '2 bed · 2 bath · 1,076 sq ft apartment',
        'title': 'MAA 1225 Sussex',
    },
    'waverly': {
        'blurb': 'Niblock Homes · Cumberland, Concord NC',
        'canvas_label': '3D model of the Waverly floor plan by Niblock Homes',
        'description': 'Walkable, to-scale 3D tour of the Niblock Homes Waverly ranch plan.',
        'loading': 'Framing the Waverly…',
        'name': 'Waverly',
        'plan': 'plans/waverly.js',
        'specs': '2 bed · 2 bath · 1,629 sq ft ranch',
        'title': 'Niblock Waverly',
    },
}

DOCUMENT_WRAPPER = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{head_extra}<style>[hidden]{{display:none!important}} body{{margin:0}}</style>
</head>
<body>
{body}
</body>
</html>
"""

# Demo tours use builders' plans, so keep them out of search results until a builder says yes.
NO_INDEX = '<meta name="robots" content="noindex, nofollow">\n'


def addon_source(path):
    local = ADDON_DIRECTORY / path
    if not local.exists():
        local.parent.mkdir(parents=True, exist_ok=True)
        local.write_text(urllib.request.urlopen(ADDON_BASE_URL + path).read().decode())
    return local.read_text()


def resolve(base_path, module):
    parts = []
    for part in (Path(base_path).parent / module).as_posix().split('/'):
        if part == '..':
            parts.pop()
        elif part != '.':
            parts.append(part)
    return '/'.join(parts)


def module_variable(path):
    return '__three_' + re.sub(r'\W', '_', path.removesuffix('.js'))


def destructure(specifiers):
    names = [name.strip() for name in specifiers.split(',') if name.strip()]
    return ', '.join(name.replace(' as ', ': ') for name in names)


def bundle_addons():
    """Inline the add-on modules as scoped blocks, dependencies first."""
    ordered, visiting = [], set()

    def visit(path):
        if path in ordered or path in visiting:
            return
        visiting.add(path)
        for _, module in IMPORT_PATTERN.findall(addon_source(path)):
            if module.startswith('.'):
                visit(resolve(path, module))
        ordered.append(path)

    for entry in ADDON_ENTRIES.values():
        visit(entry)

    blocks = []
    for path in ordered:
        source = addon_source(path)
        exported = [name.strip() for match in EXPORT_PATTERN.findall(source) for name in match.split(',') if name.strip()]
        if any(' as ' in name for name in exported):
            raise SystemExit(f'{path}: aliased exports are not supported')
        exports = ', '.join(exported)

        def rewrite_import(match, path=path):
            specifiers, module = match.groups()
            target = 'THREE' if module == 'three' else module_variable(resolve(path, module))
            return f'const {{ {destructure(specifiers)} }} = {target};'

        body = EXPORT_PATTERN.sub('', IMPORT_PATTERN.sub(rewrite_import, source))
        blocks.append(f'const {module_variable(path)} = (() => {{\n{body}\nreturn {{ {exports} }};\n}})();')

    for name, path in ADDON_ENTRIES.items():
        blocks.append(f'const {{ {name} }} = {module_variable(path)};')
    return '\n'.join(blocks)


def build(page_name, addons):
    page = PAGES[page_name]
    script = '\n'.join(
        [THREE_IMPORT, addons]
        + [(ROOT / path).read_text() for path in ENGINE_FILES + [page['plan']]]
        + ['startTour(PLAN);']
    )
    body = (ROOT / 'pages/template.html').read_text()
    replacements = {
        '{{CANVAS_LABEL}}': html.escape(page['canvas_label']),
        '{{DESCRIPTION}}': html.escape(page['description']),
        '{{LOADING}}': html.escape(page['loading']),
        '{{TITLE}}': html.escape(page['title']),
        '{{STYLE}}': (ROOT / 'src/tour.css').read_text(),
        '{{SCRIPT}}': script,
    }
    for placeholder, value in replacements.items():
        body = body.replace(placeholder, value)

    (ROOT / 'dist/preview').mkdir(parents=True, exist_ok=True)
    (ROOT / f'dist/{page_name}.html').write_text(body)
    (ROOT / f'dist/preview/{page_name}.html').write_text(DOCUMENT_WRAPPER.format(head_extra='', body=body))
    (ROOT / f'dist/preview/{page_name}.mjs').write_text(script)
    site_page = SITE_DIRECTORY / page_name / 'index.html'
    site_page.parent.mkdir(parents=True, exist_ok=True)
    site_page.write_text(DOCUMENT_WRAPPER.format(head_extra=NO_INDEX, body=body))
    print(f'built {page_name} ({len(body) // 1024} KB)')


def build_site_index():
    cards = '\n'.join(
        f"""    <li class="card">
      <a href="{name}/">
        <span class="card-eyebrow">{html.escape(page['blurb'])}</span>
        <span class="card-name">{html.escape(page['name'])}</span>
        <span class="card-specs">{html.escape(page['specs'])}</span>
        <span class="card-cta">Walk through</span>
      </a>
    </li>"""
        for name, page in PAGES.items()
    )
    body = (ROOT / 'pages/site-index.html').read_text().replace('{{CARDS}}', cards)
    (SITE_DIRECTORY / 'index.html').write_text(DOCUMENT_WRAPPER.format(head_extra=NO_INDEX, body=body))
    (SITE_DIRECTORY / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    (SITE_DIRECTORY / '.nojekyll').write_text('')


if __name__ == '__main__':
    addon_bundle = bundle_addons()
    shutil.rmtree(SITE_DIRECTORY, ignore_errors=True)
    for name in sys.argv[1:] or PAGES:
        build(name, addon_bundle)
    build_site_index()
