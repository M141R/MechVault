# -*- coding: utf-8 -*-
"""Insert a #modpyq (PYQs by Module) section into som.html, built from
canonical transcription of every SOM paper MO2022-MO2025."""
import io, re

PATH = 'src/content/som.html'

def R(no, marks, text, module, page):
    return {'no': no, 'marks': marks, 't': text, 'm': module, 'page': page}

MID22 = [
 R('Q.1',5,'At a certain point in a material \u03c3\u2093 = S, \u03c3\u1d67 = S/2 and \u03c4\u2093\u1d67 = S/4. If the maximum shear stress is not to exceed 120 MN/m\u00b2, determine S. Also determine the corresponding values of the principal stresses',1,1),
 R('Q.2',5,'Figure 1 shows a rigid bar ABC hinged at A and suspended at points B and C by two bars BD and CE made of aluminium and steel respectively. The bar carries a load of 20 kN midway between B and C. Cross-sectional areas: aluminium bar BD = 3 mm\u00b2, steel bar CE = 2 mm\u00b2. Determine the load taken up by each bar and the respective stresses developed. Take E<sub>Al</sub> = 70 kN/mm\u00b2, E<sub>S</sub> = 200 kN/mm\u00b2',1,1),
 R('Q.3',5,'Draw the shear force and bending moment diagrams for the simply supported beam shown loaded in Figure 2 (5 kN point load, 2 kN/m UDL over part span, 10 kN point load). Clearly mark the position of the maximum bending moment and determine its value',2,1),
 R('Q.4',5,'Derive the complete expression for the bending stresses in a beam',2,1),
 R('Q.5',5,'Determine the distribution of shear stress of a rectangular beam having width B and height H, taking F as the shear force',2,1),
]
END22 = [
 R('Q.1',10,'The strain components at a given point are \u03b5\u2093 = \u2212533\u00d710\u207b\u2076, \u03b5\u1d67 = 67\u00d710\u207b\u2076 and \u03b3\u2093\u1d67 = \u2212626\u00d710\u207b\u2076. If E = 200 GPa and \u03bd = 0.30, find the stress components whose normal is at 45\u00b0 from the x axis',1,1),
 R('Q.2',10,'An I-section girder, 200 mm wide \u00d7 300 mm deep with flange and web thickness 20 mm, is used as a simply supported beam of span 7 m. It carries a distributed load of 5 kN/m and a concentrated load of 20 kN at mid-span. Determine (i) the second moment of area of the cross-section, (ii) the maximum stress set up',2,1),
 R('Q.3',10,'A concentrated load of 300 N is applied to the simply supported beam shown in Fig. 2 (R\u2081 = 100 N, R\u2082 = 200 N). Determine the equations of the elastic curve between each change of load point and the maximum deflection in the beam',3,1),
 R('Q.4',10,'(a) Derive the complete torsion equation for a circular shaft. (b) The solid shaft is fixed to the support at C and subjected to the torsional loadings shown (Fig. 3). Determine the shear stress at points A and B and sketch the shear stress on volume elements located at these points',3,1),
 R('Q.5',10,'Calculate the minimum wall thickness for a thin-walled cylindrical pressure vessel to carry a gas at a pressure of 10 MPa. Diameter of the vessel is 0.6 m and the stress is limited to 85 MPa',5,1),
]
MID23 = [
 R('Q.1',5,'A steel bar with a butt-welded joint (57\u00b0 to the axis, width 100 mm) carries an axial tensile load of 400 kN. If the normal and shear stresses on the plane of the butt weld must be limited to 70 MPa and 45 MPa respectively, determine the minimum thickness t required for the bar',1,1),
 R('Q.2',5,'Derive the expressions for principal stresses and maximum shearing stress in plane stress condition described by \u03c3\u2093, \u03c3\u1d67 and \u03c4\u2093\u1d67',1,1),
 R('Q.3',5,'For the stress element shown in figure (100 MPa normal, 80 MPa normal, 60 MPa shear), find the normal and shear stresses on plane AB at 48\u00b0',1,1),
 R('Q.4',5,'Explain shear forces and bending moments in beams with neat diagrams. Also explain the sign convention',2,1),
 R('Q.5',5,'Find the support reactions and draw the shear force and bending moment diagrams for the beam shown (20 kN point load at 1 m, 50 kN point load, 60 kN/m UDL over the last 2 m; spans 1 m, 2 m, 2 m)',2,1),
]
END23 = [
 R('Q.1(a)',5,'Derive expressions for the normal and shear stresses on an inclined plane for the plane stress condition given by \u03c3\u2093, \u03c3\u1d67 and \u03c4\u2093\u1d67',1,1),
 R('Q.1(b)',5,'The stress condition on the outer surface of a body is \u03c3\u2093 = 50 MPa, \u03c3\u1d67 = \u221210 MPa and \u03c4\u2093\u1d67 = 40 MPa. Determine the orientation of the principal planes and the values of the principal stresses',1,1),
 R('Q.2(a)',5,'Derive an expression for the shear stress in a beam of rectangular cross section',2,1),
 R('Q.2(b)',5,'A machine part is acted upon by a 3 kN.m bending moment. Cross-section shown in Figure (90 mm flange, stepped web). Knowing E = 165 GPa, determine the maximum tensile and compressive stresses in the machine part',2,1),
 R('Q.3(a)',5,'What do you understand by buckling of a column? Derive an expression for Euler buckling load (P<sub>cr</sub>)',3,1),
 R('Q.3(b)',5,'A cantilever beam of length L is acted upon by a point load at distance L/2 from the fixed end. Find the deflection at the free end. Take EI as constant',3,1),
 R('Q.4(a)',5,'Derive an expression for stress distribution due to bending moment in a curved beam',4,1),
 R('Q.4(b)',5,'A channel section is used as a cantilever beam supporting load P at the free end (flanges 125 mm, webs 230 mm + 230 mm, metal 12 mm thick). Assuming all of the section effective in resisting flexural stresses and only the web resists vertical shearing stresses, locate the shear center (e) with respect to the center of the web',4,1),
 R('Q.5(a)',5,'Derive expressions for hoop stress and longitudinal stress in thin cylinders',5,1),
 R('Q.5(b)',5,'A thick cylinder of 100 mm internal radius and 150 mm external radius is subjected to an internal pressure of 60 MPa and an external pressure of 30 MPa. Determine the hoop and radial stresses at the radius of 120 mm',5,1),
]
MID24P1 = [
 R('Q.1',5,'At a point on the surface of a machine part, the state of stress on two elements inclined at angle \u03b8 are shown in figure. Prove that \u03c3\u2093 + \u03c3\u1d67 = \u03c3\u2093\u2032 + \u03c3\u1d67\u2032',1,1),
 R('Q.2',5,'For the stress element shown in figure, find the normal and shear stresses on plane AB (48\u00b0; 100 MPa normal, 80 MPa normal, 60 MPa shear)',1,1),
 R('Q.3',5,'At a point on the surface of an alloy steel machine part (E = 210 GPa, \u03bd = 0.30) under biaxial stress, measured strains were \u03b5\u2093 = +1394\u00d710\u207b\u2076, \u03b5\u1d67 = \u2212660\u00d710\u207b\u2076, \u03b3\u2093\u1d67 = +2054\u00d710\u207b\u2076. Determine the principal strains and the maximum shear stress at the point',1,1),
 R('Q.4',5,'Derive the expression for bending stress in a beam',2,1),
 R('Q.5',5,'Find the support reactions and draw the shear force and bending moment diagrams for the beam shown (20 kN at 1 m, 50 kN at 3 m, 60 kN/m over last 2 m)',2,1),
]
END24P2 = [
 R('Q.1(a)',5,'The stresses shown in figure act at a point in a stressed body (125 MPa normal, 95 MPa normal, 20\u00b0 inclined plane a-b). Determine the normal and shear stresses on the inclined plane a-b',1,1),
 R('Q.1(b)',5,'The stresses on two perpendicular planes at a point on the outside surface of a solid circular bar (200 MPa normal, 25 MPa shear) are shown. Determine the orientation of the principal planes and the values of the principal stresses',1,1),
 R('Q.2(a)',5,'The beam of figure (T-section: flange 100 mm \u00d7 50 mm, web 37.5 mm \u00d7 200 mm) is made of a material with tensile and compressive yield strength 200 MPa. Determine the maximum resisting moment the beam can support if yielding must be avoided',2,1),
 R('Q.2(b)',5,'Derive an expression for shear stress in a beam of rectangular cross section',2,1),
 R('Q.3(a)',5,'The beam is loaded and supported as shown (simply supported, point loads P at L and 2L). Use Macaulay\u2019s functions to determine the deflection: (a) at distance x = L from the left support, (b) at the middle of the span',3,2),
 R('Q.3(b)',5,'A 5 m long column with the cross section shown (four identical timber pieces, hollow box 100 mm \u00d7 100 mm) is constructed with E = 14 GPa, timbers nailed to act as a unit. Determine the Euler buckling load considering hinged-hinged support',3,2),
 R('Q.4(a)',5,'Derive an expression for the shear center of the C-channel shown in figure (thickness t_f, t_w; depth h; flange width b)',4,2),
 R('Q.4(b)',5,'A curved bar with rectangular cross section (width 35 mm, height 70 mm, inside radius 50 mm) is subjected to a bending moment M = 4500 N.m acting in the direction shown. Determine the bending stresses in the curved bar at points A and B',4,2),
 R('Q.5(a)',5,'Derive the expressions for hoop stress and longitudinal stress in a thin cylinder with neat diagrams',5,2),
 R('Q.5(b)',5,'A thick-walled cylindrical pressure vessel of inner diameter 200 mm and outer diameter 300 mm is made of hardened steel with yield strength 430 MPa. Determine the maximum internal pressure that may be applied if yield strength must not be exceeded',5,2),
]
MID25 = [
 R('Q.1(a)',2,'Illustrate a non-zero state of stress where |\u03c4max| = |\u03c4min| = |\u03c3\u2081| = |\u03c3\u2082|',1,1),
 R('Q.1(b)',3,'Two wooden joists 50 mm \u00d7 100 mm are glued along AB. P = 200 kN and the glue joint is at 60\u00b0 to the load axis. Find the normal and shearing stress in the glue',1,1),
 R('Q.2',5,'For the stress element shown in figure, find the principal stresses and their orientation with respect to the x-axis. Also find the stress components on planes at 45\u00b0 and 135\u00b0',1,1),
 R('Q.3',5,'The strain components are \u03b5\u2093 = \u2212800\u00d710\u207b\u2076, \u03b5\u1d67 = 200\u00d710\u207b\u2076, \u03b3\u2093\u1d67 = \u2212800\u00d710\u207b\u2076. Using E = 200 GPa and \u03bd = 0.3, find the stress components acting on the face whose normal is at +20\u00b0 from the x-axis',1,1),
 R('Q.4',5,'Write the shear-force and bending-moment equations for the beam shown (simply supported ABC; AB = 2 m with point load 80 kN at B, UDL 10 kN/m over the entire 10 m span). Draw the SFD and BM diagram marking salient points including maximum BM',2,1),
 R('Q.5(a)',3,'Derive the flexure formula for a beam subjected to pure bending',2,1),
 R('Q.5(b)',2,'A high-strength steel band saw 20 mm wide \u00d7 0.8 mm thick runs over pulleys of 600 mm diameter. Find the maximum flexural stress. E = 200 GPa',2,1),
]
END25 = [
 R('Q.1(a)',5,'For the element shown in Fig. Q.1(a) (\u03c3\u2093, \u03c3\u1d67, 30 MPa shear), determine the values of \u03c3\u2093 and \u03c3\u1d67 if the principal stresses are known to be 20 MPa and \u221280 MPa',1,1),
 R('Q.1(b)',5,'\u03b5\u2093 = \u2212400\u00d710\u207b\u2076, \u03b5\u1d67 = 200\u00d710\u207b\u2076 and \u03b3\u2093\u1d67 = 800\u00d710\u207b\u2076. If E = 200 GPa and \u03bd = 0.3, determine the principal stresses and maximum shearing stress',1,1),
 R('Q.2(a)',2,'Derive the relationship between load, shear force and bending moment for beam problems',2,1),
 R('Q.2(b)',4,'Write the shear force and bending moment equations for the cantilever beam shown (UDL w\u2080 over half the length from free end A; fixed at C). Draw the diagrams specifying values at load-changing points. Take w\u2080 = 50 kN/m, L = 2 m',2,1),
 R('Q.2(c)',4,'In a laboratory test of a beam loaded by end couples, fibres at layer AB increase 60\u00d710\u207b\u00b3 mm over a 200 mm gauge length whereas those at CD decrease 100\u00d710\u207b\u00b3 mm (layer distances 30 mm, 120 mm, 75 mm per figure). Using E = 70 GPa, determine the flexural stress at the top and bottom fibres',2,1),
 R('Q.3(a)',6,'The simply supported beam shown carries a uniform load of intensity w\u2080 symmetrically distributed over part of its length (a + 2b + a). Determine the maximum deflection \u03b4',3,2),
 R('Q.3(b)',4,'A 50 mm diameter steel shaft rotates at 240 rpm. If the shearing stress is limited to 80 MPa, determine the maximum power that can be transmitted',3,2),
 R('Q.4(a)',5,'A circular bar bent into the shape of a half ring is supported vertically as shown (radius R, horizontal load P at C). Determine the horizontal movement of point C',4,2),
 R('Q.4(b)',5,"Write a short note on limitations of Euler's long column formula",3,2),
 R('Q.5(a)',6,'Derive expressions for tangential and radial stresses for a thick-walled cylinder subjected to inside and outside pressures P\u1d62 and P\u2092 respectively',5,2),
 R('Q.5(b)',4,'A tank shown in Fig. Q.5(b) (400 mm \u00d7 600 mm) is fabricated from 1 mm thick steel sheet. Calculate the longitudinal and circumferential stresses caused by an internal pressure of 500 kPa',5,2),
]

PAPERS = [
 ('SOM_MO2022_MID','MID MO2022','MID',[1],MID22),
 ('SOM_MO2022_END','END MO2022','END',[1],END22),
 ('SOM_MO2023_MID','MID MO2023','MID',[1],MID23),
 ('SOM_MO2023_END','END MO2023','END',[1],END23),
 ('SOM_MO2024_P1','MID MO2024','MID',[1],MID24P1),
 ('SOM_MO2024_P2','END MO2024','END',[1,2],END24P2),
 ('SOM_MO2025_MID','MID MO2025','MID',[1],MID25),
 ('SOM_MO2025_END','END MO2025','END',[1,2],END25),
]
MODULES = {1:'Stresses & Strains',2:'Bending & Shear',3:'Deflection & Columns',4:'Curved Beams & Shear Center',5:'Thin & Thick Cylinders'}

def qrow(q, base, label):
    zoom = '/api/file?path=images/papers/%s_p%d.png' % (base, q['page'])
    cap = '%s \u00b7 %s \u00b7 p%d' % (q['no'], label, q['page'])
    return ('\n          <tr><td><strong>%s</strong></td><td>%d</td><td>%s '
            '<span class="qzoom"><a class="qlink" data-zoom="%s" data-caption="%s">\U0001F4C4 p%d</a></span></td></tr>'
            % (q['no'], q['marks'], q['t'], zoom, cap, q['page']))

def thumbs(base, pages, label):
    cells = ''.join(
        '\n          <div class="paper-thumb" data-zoom="/api/file?path=images/papers/%s_p%d.png" '
        'data-caption="%s \u00b7 page %d"><img src="/api/file?path=images/papers/%s_p%d.png" alt="%s paper page %d"></div>'
        % (base, p, label, p, base, p, base, p) for p in pages)
    return '<div class="two-col">%s\n        </div>' % cells

cards = []
for m in (1, 2, 3, 4, 5):
    groups = []
    for base, label, tag, pages, qs in PAPERS:
        mqs = [q for q in qs if q['m'] == m]
        if not mqs:
            continue
        rows = ''.join(qrow(q, base, label) for q in mqs)
        groups.append(
            '\n      <div class="paper-group">\n        <h4>%s <span class="tag">%s</span></h4>\n        ' % (label, tag)
            + thumbs(base, pages, label)
            + '\n        <div class="table-wrap"><table>\n          <tr><th>Q.No</th><th>Marks</th><th>Question</th></tr>%s\n        </table></div>\n      </div>' % rows)
    n = sum(len([q for q in qs if q['m'] == m]) for _, _, _, _, qs in PAPERS)
    cards.append(
        '\n    <div class="modpyq-card">'
        '\n      <div class="modpyq-head"><span class="mchip">%d</span> <strong>%s</strong> '
        '<span class="tag">CO-%d</span> <span class="tag tag-high">%d PYQs</span></div>' % (m, MODULES[m], m, n)
        + ''.join(groups) + '\n    </div>')

section = ('<section class="section section-alt" id="modpyq">'
           '\n  <div class="container">'
           '\n    <div class="section-head">'
           '\n      <div class="section-eyebrow">PYQs by Module</div>'
           '\n      <h2>Every past question, grouped by module</h2>'
           '\n      <p>All questions from MO 2022\u20132025, grouped under the module they came from \u2014 practice module by module.</p>'
           '\n    </div>'
           + ''.join(cards)
           + '\n  </div>\n</section>\n\n')

c = io.open(PATH, encoding='utf-8').read()
anchor = c.find('<section class="section section-alt" id="pyqs">')
assert anchor != -1
c = c[:anchor] + section + c[anchor:]
io.open(PATH, 'w', encoding='utf-8').write(c)

# verify
seg = c[c.index('id="modpyq"'):c.index('id="pyqs"')]
print('cards:', seg.count('class="modpyq-card"'), '| groups:', seg.count('paper-group'))
for m in range(1, 6):
    n = sum(len([q for q in qs if q['m'] == m]) for _, _, _, _, qs in PAPERS)
    print('M%d expected %d' % (m, n))
