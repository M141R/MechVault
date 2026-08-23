import io, re

PATH = 'src/content/fm.html'
c = io.open(PATH, encoding='utf-8').read()

def R(no, marks, text, module, page):
    return {'no': no, 'marks': marks, 't': text, 'm': module, 'page': page}

# ================= CANONICAL FM DATA =================
# (qno, marks, text, module, page)
MID22 = [
 R('Q.1(a)',2,'Explain the importance of viscosity in fluid motion',1,1),
 R('Q.1(b)',3,'A square plate of size 1 m x 1 m and weighting 350 N slides down an incline plane with a uniform velocity of 1.5 m/s as shown in Figure below. The incline plane is laid on a slope of 5 vertical to 12 horizontal and has an oil film of 1 mm thickness. Determine the dynamic viscosity of oil in SI Unit',1,1),
 R('Q.2(a)',2,'What is a manometer? How are they classified?',1,1),
 R('Q.2(b)',3,'A U-Tube manometer is used to measure the pressure of water in a pipeline, which is in excess of atmospheric pressure. The right limb contains mercury and is open to atmosphere, the contact between water and mercury being in the left limb. If the difference in level of mercury in the limbs is 10 cm and the free surface of mercury is in level with the center of the pipeline as shown in Figure, determine the pressure of water in the main line',1,1),
 R('Q.3(a)',2,'Derive the continuity equation in differential form for a 2D flow in Cartesian coordinate system',2,2),
 R('Q.3(b)',3,'u = x\u00b3 + y\u00b2 + z\u00b2 ; v = xy\u00b2 \u2212 yz\u00b2 + xy. Determine the third component of velocity such that they satisfy the continuity equation',2,2),
 R('Q.4(a)',2,'Distinguish between (i) steady and un-steady flow, (ii) uniform and non-uniform flow, (iii) rotational and irrotational flow, (iv) laminar and turbulent flow',2,2),
 R('Q.4(b)',3,'A fluid flow is given by V = 8x\u00b3i \u2212 10x\u00b2yj. Determine the shear strain rate and state whether the flow is rotational or irrotational',2,2),
 R('Q.5(a)',2,'What do you understand by the term losses of energy of the flowing fluids in pipes',3,2),
 R('Q.5(b)',3,'A crude oil of kinematic viscosity 0.4 \u00d7 10\u207b\u2074 m\u00b2/s flows through a pipe of diameter 300 mm at a rate of 0.3 m\u00b3/s. Using Darcy-Weisbach equation, determine the head lost due to friction for a length of 50 m of the pipe. Given friction factor f = 0.079/(R<sub>e</sub>)^\u00bc, where R<sub>e</sub> is Reynolds Number',3,2),
]
END22 = [
 R('Q.1(a)',2,'Define the following terms: (i) Density, (ii) weight density, (iii) specific gravity, (iv) specific volume',1,1),
 R('Q.1(b)',3,'A plate 0.025 mm distant from a fixed plate moves at 60 cm/s and requires a force of 2 N/sq.m to maintain this speed. Determine the dynamic viscosity of the fluid between the plates',1,1),
 R('Q.1(c)',5,'An inverted differential manometer as shown in Fig. 1 connects two pipes A and B containing water; the manometric fluid is oil of sp. gr. 0.8. For the manometer readings shown, determine the difference of pressure head between A and B',1,1),
 R('Q.2(a)',2,'Distinguish between stream line, streak line and path line in a fluid flow',2,1),
 R('Q.2(b)',3,"Prove Bernoulli's theorem for fluid flow. Also state the assumptions being made",2,1),
 R('Q.2(c)',5,'A tapered horizontal pipe with inlet diameter 25 cm carries oil of sp. gr. 0.9 at a velocity of 3 m/s. The outlet diameter is 20 cm. Determine the velocity of oil at the outlet section and also the flow rate of oil through this tapered pipe',2,1),
 R('Q.3(a)',2,'Distinguish between major and minor losses in pipes',3,1),
 R('Q.3(b)',3,'What is a boundary layer? How does a boundary layer get separated from the boundary, and what are the standard ways to control the separation',3,1),
 R('Q.3(c)',5,'A horizontal pipe line 40 m long is connected to a tank at one end and discharges freely into the atmosphere at the other end (d\u2081 = 0.15 m, d\u2082 = 0.3 m, lengths per Fig. 2). The water level in the tank is 8 m above the pipe centerline. Take friction factor f = 0.01. Considering all losses of head, determine the rate of flow. Also draw the hydraulic gradient line and total energy line for this circuit',3,1),
 R('Q.4(a)',2,'Classify various types of hydro-turbines',4,2),
 R('Q.4(b)',3,'With a neat sketch explain the working of an inward flow reaction turbine',4,2),
 R('Q.4(c)',5,'Determine the power given by the jet of water to the runner of a Pelton wheel having tangential velocity 20 m/s. Net head on the turbine is 50 m and discharge through the jet is 0.03 m\u00b3/s. Blade angle at outlet with tangential direction \u03c6 = 15\u00b0. Take coefficient of velocity as 0.975',4,2),
 R('Q.5(a)',2,'Define the following terms for a centrifugal pump: (i) suction head, (ii) delivery head, (iii) static head, (iv) manometric head',5,2),
 R('Q.5(b)',3,'With a neat sketch describe the principle of working of a reciprocating pump',5,2),
 R('Q.5(c)',5,'A centrifugal pump has outer diameter equal to two times the inner diameter and runs at 1000 rpm against a total head of 40 m. Velocity of flow through the impeller is constant at 2.5 m/s. Vanes are set backwards at 40\u00b0 at outlet. Outer diameter 500 mm, width 50 mm. Determine (i) vane angle at inlet, (ii) work done by the impeller on water per second, (iii) manometric efficiency',5,2),
]
MID23 = [
 R('Q.1(a)',2,'Define the term continuum for fluids. What is its importance in fluid domain',1,1),
 R('Q.1(b)',3,'Determine the dynamic viscosity of an oil used for lubrication between a square plate 0.8 m x 0.8 m and an inclined plane at 30 degrees as shown in Figure. Weight of the plate is 300 N and it slides down with uniform velocity 0.3 m/s. Thickness of oil film is 1.5 mm',1,1),
 R('Q.2(a)',2,'What is the difference between U-tube differential manometer and inverted U-tube differential manometer? Where are they used?',1,1),
 R('Q.2(b)',3,'An inverted U-tube differential manometer is connected to two pipes A and B conveying water as shown in Figure. Manometric fluid is oil of specific gravity 0.8. For the manometer readings, determine the gauge pressure difference between A and B',1,1),
 R('Q.3(a)',2,'With a suitable sketch explain the term stream line in a fluid flow',2,1),
 R('Q.3(b)',3,'A fluid flow is given by V = (x\u00b2y)i + (y\u00b2z)j \u2212 (2xyz + yz\u00b2)k. Analyze this flow for its continuity and rotationality at point (2, 1, 3)',2,1),
 R('Q.4(a)',2,'Distinguish between laminar flow and turbulent flow',2,2),
 R('Q.4(b)',3,'The diameter of a pipe gradually reduces from 1 m to 0.7 m as shown in Figure. Pressure intensity at the centerline of the 1 m section is 7.848 kN/sq.m and rate of flow of water is 600 liters/second. Determine (i) pressure intensity at the centerline of the 0.7 m section, (ii) force exerted by the flowing fluid on the tapered portion (reducer) of the pipe',2,2),
 R('Q.5(a)',2,'Distinguish between major and minor losses in pipes',3,2),
 R('Q.5(b)',3,'Crude oil of kinematic viscosity 0.4 \u00d7 10\u207b\u2074 sq.m./sec flows through a 300 mm diameter pipe at 0.3 m\u00b3/sec. Determine (i) head loss due to friction for a 50 m length, (ii) Reynolds number of the flow. Take coefficient of friction as 0.006',3,2),
]
END23 = [
 R('Q.1(a)',5,"State and prove Pascal's law of static pressure",1,1),
 R('Q.1(b)',5,'A vertical gap 2.2 cm wide of infinite extent contains a fluid of viscosity 2.0 N-s/m\u00b2 and specific gravity 0.9. A metallic plate 1.2 m x 1.2 m x 0.2 cm is lifted at constant velocity 0.15 m/s through the middle of the gap. Determine the force required. Weight of the plate is 40 N',1,1),
 R('Q.2(a)',5,'Explain the following terms: (i) linear translation, (ii) angular deformation, (iii) rotation, and (v) vorticity of a fluid element',2,1),
 R('Q.2(b)',5,'A lawn sprinkler as shown in figure has 0.8 cm diameter nozzles at the ends of a rotating arm and discharges water at 10 m/s. Determine the torque required to hold the arm stationary. Also determine the constant speed of rotation if free to rotate',2,1),
 R('Q.3(a)',5,'What is an orifice meter? Prove that the discharge through an orifice meter is given by Q = C<sub>d</sub> \u00b7 (a\u2080\u00b7a\u2081/\u221a(a\u2081\u00b2 \u2212 a\u2080\u00b2)) \u00b7 \u221a(2gh), where a\u2081 = area of the pipe and a\u2080 = area of the orifice',3,1),
 R('Q.3(b)',5,'Determine the rate of flow of water through a pipe of diameter 20 cm and length 50 m, one end connected to a tank and other end open to atmosphere. Pipe is horizontal, water level in the tank is 4 m above the pipe centerline. Consider all minor losses and take f = 0.009 in Darcy-Weisbach equation. Also draw the Total Energy Line and Hydraulic Gradient Line',3,1),
 R('Q.4(a)',5,'A Francis turbine of overall efficiency 75% produces 148.25 kW under a head of 7.62 m. Peripheral velocity = 0.26(2gH)^0.5 and radial velocity of flow at inlet = 0.96(2gH)^0.5. Wheel runs at 150 rpm; hydraulic losses are 22% of available energy. Assuming radial discharge, determine (i) guide blade angle, (ii) wheel vane angle',4,2),
 R('Q.4(b)',5,'What is governing of a hydraulic turbine? Briefly explain the governing of an impulse turbine',4,2),
 R('Q.5(a)',5,'A centrifugal pump has outer diameter equal to two times the inner diameter and runs at 1000 rpm against a total head of 40 m. Flow velocity through the impeller is constant at 2.5 m/s. Vanes set backward at 40\u00b0 at outlet. Outer diameter 500 mm, width at outlet 50 mm. Determine work done by the impeller on water per second',5,2),
 R('Q.5(b)',5,'Briefly explain the working of a reciprocating pump',5,2),
]
MID24 = [
 R('Q.1(a)',2,'What does the term continuum signify in fluid dynamics? Justify your answer with suitable explanation',1,1),
 R('Q.1(b)',3,'Determine the specific weight, density and specific gravity of one litre of liquid which weighs 7 N',1,1),
 R('Q.2(a)',2,"Define Newton's Law of dynamic viscosity. How does the dynamic viscosity change with temperature for liquids",1,1),
 R('Q.2(b)',3,'Evaluate the capillary rise in a glass tube of 2.5 mm diameter when immersed vertically in (a) water and (b) Mercury. Surface tension \u03c3 = 0.0725 N/m for water and \u03c3 = 0.52 N/m for Mercury in contact with air; specific gravity of Mercury 13.6, angle of contact 130 degrees',1,1),
 R('Q.3(a)',2,'Explain with suitable sketch the Eulerian and Lagrangian description of fluid flow. How can they be related with each other',2,1),
 R('Q.3(b)',3,'Wind blows North to South from 11.00 AM to 11.30 AM and East to West from 11.30 AM to 12.00 Noon. Construct the STREAK LINE and visualize the flow using a time interval of 10 minutes',2,1),
 R('Q.4(a)',2,"Derive Euler's Equation of motion for fluid flow. Mention the assumptions made",2,1),
 R('Q.4(b)',3,'A fluid flow is given by V = 8x\u00b3i \u2212 10x\u00b2yj. Determine (i) shear strain rate, (ii) rotation or vorticity',2,1),
 R('Q.5(a)',2,'Distinguish between major and minor losses of energy in fluid flow through pipes',3,1),
 R('Q.5(b)',3,'An oil of specific gravity 0.7 flows through a 300 mm diameter pipe at 500 Liter/second. Evaluate head loss due to friction and power required to maintain the flow for a length of 1000 m. Kinematic viscosity 0.29 \u00d7 10\u207b\u2074 m\u00b2/s, friction factor f = 0.079/(R<sub>e</sub>)^0.25',3,1),
]
END24 = [
 R('Q.1(a)',5,'Velocity profile of a fluid over a plate is parabolic with vertex 20 cm from the plate where velocity is 120 cm/sec (Fig.). Determine velocity gradients and shear stresses at distances 0, 10 and 20 cm from the plate. Dynamic viscosity 0.85 N-s/m\u00b2',1,1),
 R('Q.1(b)',5,'Determine the differential reading (h) of an inverted tube manometer containing oil of specific gravity 0.7 connected across pipes A and B conveying liquids of specific gravities 1.2 and 1.0 (Fig.). Pipes are at the same level; pressures at A and B are equal',1,1),
 R('Q.2(a)',5,'Derive the expression for the continuity equation in the differential form \u2202u/\u2202x + \u2202v/\u2202y = 0',2,1),
 R('Q.2(b)',5,'A 30 cm x 15 cm Venturimeter is inserted in a vertical pipe carrying water, flow upwards; throat diameter 15 cm, pipe diameter 30 cm. Differential mercury manometer connected to inlet and throat reads 20 cm of mercury. Determine the discharge. Coefficient of discharge 0.98',2,2),
 R('Q.3(a)',5,'Using basic principles of fluid flow, derive the discharge expression for an Orifice-meter in the form Q = C<sub>d</sub> \u00b7 ((a\u2080a\u2081)/\u221a(a\u2081\u00b2 \u2212 a\u2080\u00b2)) \u00b7 \u221a(2gH), where a\u2081 = pipe area and a\u2080 = orifice area',3,2),
 R('Q.3(b)',5,'With suitable sketch explain the concept of boundary layer separation over a convex surface. How can the separation be controlled?',3,2),
 R('Q.4(a)',5,'What is governing? With a neat sketch explain the governing of a Pelton turbine',4,2),
 R('Q.4(b)',5,'A 137 mm diameter jet of water issuing from a nozzle impinges on a series of Pelton wheel buckets; relative velocity is deflected through 165\u00b0. Head at nozzle 400 m, coefficient of velocity 0.97, speed ratio 0.46, reduction in relative velocity through the bucket 15%. Evaluate (i) force exerted by the jet on buckets in the tangential direction, (ii) power developed',4,2),
 R('Q.5(a)',5,'With neat sketch explain the working of a single acting reciprocating pump fitted with air vessels. What happens if the air vessels are removed from the pump unit?',5,2),
 R('Q.5(b)',5,'A centrifugal pump discharges 0.15 m\u00b3/s against a head of 12.5 m at 600 rpm. Impeller outer/inner diameters 500 mm / 250 mm; vanes bent backwards at 35\u00b0 to the tangent at exit; flow area remains 0.07 sq.m from inlet to outlet. Evaluate (i) manometric efficiency, (ii) vane angle at inlet',5,2),
]
MID25 = [
 R('Q.1(a)',2,'Discuss the concept of continuum in fluid flow practices',1,1),
 R('Q.1(b)',3,'A plate 0.025 mm distant from a fixed plate moves at 0.6 m/s requiring a shear force per unit area of 2 N/m\u00b2. Determine the dynamic viscosity of the flowing fluid between the plates',1,1),
 R('Q.2(a)',2,'With suitable sketch discuss: (i) Piezometer, (ii) Differential U Tube manometer',1,1),
 R('Q.2(b)',3,'A rectangular plane surface 2 m wide and 3 m deep lies in a vertical plane in water. Determine total pressure and position of center of pressure when its upper edge is horizontal (Figure). Given h* = I\u1d04/(Ah\u0304) + h\u0304, where I\u1d04 is moment of inertia about the axis through C.G. parallel to base',1,1),
 R('Q.3(a)',2,'Distinguish between: (i) steady and unsteady flow, (ii) one, two and three dimensional flow',2,1),
 R('Q.3(b)',3,'Pipe diameters at sections 1 and 2 are D\u2081 = 10 cm and D\u2082 = 15 cm respectively. Determine the discharge if the velocity of water at section 1 is 5 m/s (Figure). Also determine the velocity at section 2',2,1),
 R('Q.4(a)',2,'Discuss the various forces present in a fluid flow when the fluid is a real one',2,2),
 R('Q.4(b)',3,"Using Navier-Stokes equation for inviscid, incompressible, irrotational and steady flow, develop (derive) Bernoulli's equation for total energy along a streamline",2,2),
 R('Q.5(a)',2,"Using Bernoulli's equation, develop a relation for theoretical discharge through a horizontal Venturi meter",3,2),
 R('Q.5(b)',3,'A horizontal Venturimeter with inlet and throat diameters 30 cm and 15 cm measures water flow. The differential U-tube manometer (mercury) connected to inlet and throat shows 20 cm mercury. Coefficient of discharge 0.98. Determine the rate of flow',3,2),
]
END25 = [
 R('Q.1(a)',5,'Define center of pressure and determine the total pressure on a circular plate of diameter 1.5 m placed vertically in water with its center 3.0 m below the free surface. Also determine the position of center of pressure',1,1),
 R('Q.1(b)',5,'A single column manometer is connected to a pipe containing liquid of specific gravity 0.9. Determine the pressure in the pipe if the reservoir area is 100 times the tube area for the manometer reading shown (Figure). Manometric fluid is mercury with specific gravity 13.6',1,1),
 R('Q.2(a)',5,"Derive Euler's equation of motion along a stream line. State the basic assumptions made to derive it",2,1),
 R('Q.2(b)',5,'The velocity components in a two-dimensional flow are u = y\u00b3/3 + 2x \u2212 x\u00b2y and v = xy\u00b2 \u2212 2y \u2212 x\u00b3/3. Determine whether the flow is rotational or irrotational',2,1),
 R('Q.3(a)',5,'What is Boundary Layer? Explain with a neat sketch the phenomenon of boundary layer separation. How can separation of boundary layer be controlled',3,1),
 R('Q.3(b)',5,'An orifice meter with orifice diameter 10 cm is inserted in a 20 cm diameter pipe. Pressure gauges upstream and downstream read 19.62 N/cm\u00b2 and 9.81 N/cm\u00b2 respectively. Coefficient of discharge of the orifice plate is 0.6. Determine the discharge through the pipe',3,1),
 R('Q.4(a)',5,'What is governing of a turbine? With a neat sketch explain the mechanism of governing of an impulse turbine',4,1),
 R('Q.4(b)',5,'Data for an inward flow reaction turbine: net head 60 m, speed 700 rpm, shaft power 294.3 kW, overall efficiency 84%, hydraulic efficiency 93%, flow ratio 0.2, breadth ratio 0.1, outer diameter = 2 \u00d7 inner diameter of runner. Vane thickness occupies 5% of circumferential area; velocity of flow constant at inlet and outlet; discharge radial at outlet. Draw velocity triangles and determine (i) guide blade angle, (ii) runner vane angles at inlet and outlet, (iii) runner diameter at inlet and outlet',4,1),
 R('Q.5(a)',5,'Explain with a neat sketch the working of a double acting reciprocating pump fitted with air vessels. Also draw its ideal indicator diagram',5,1),
 R('Q.5(b)',5,'What is cavitation? How is it different from priming? Clearly mention the effects of cavitation and precautions against cavitation of centrifugal pumps and turbines',5,1),
]

PAPERS = [
 ('FM_MO2022_MID','MID MO2022','MID',[1,2],MID22),
 ('FM_MO2022_END','END MO2022','END',[1,2],END22),
 ('FM_MO2023_MID','MID MO2023','MID',[1,2],MID23),
 ('FM_MO2023_END','END MO2023','END',[1,2],END23),
 ('FM_MO2024_P1','MID MO2024','MID',[1],MID24),
 ('FM_MO2024_P2','END MO2024','END',[1,2],END24),
 ('FM_MO2025_MID','MID MO2025','MID',[1,2],MID25),
 ('FM_MO2025_END','END MO2025','END',[1],END25),
]
MODULES = {1:'Fluid Statics',2:'Kinematics & Dynamics',3:'Closed Conduit Flow',4:'Hydraulic Turbines',5:'Pumps'}

def qrow(q, base, label):
    zoom = f'/api/file?path=images/papers/{base}_p{q["page"]}.png'
    cap = f'{q["no"]} \u00b7 {label} \u00b7 p{q["page"]}'
    return (f'\n          <tr><td><strong>{q["no"]}</strong></td><td>{q["marks"]}</td>'
            f'<td>{q["t"]} <span class="qzoom"><a class="qlink" data-zoom="{zoom}" '
            f'data-caption="{cap}">\U0001F4C4 p{q["page"]}</a></span></td></tr>')

def thumbs(base, pages, label):
    cells = ''.join(
        f'\n          <div class="paper-thumb" data-zoom="/api/file?path=images/papers/{base}_p{p}.png" '
        f'data-caption="{label} \u00b7 page {p}"><img src="/api/file?path=images/papers/{base}_p{p}.png" '
        f'alt="{label} paper page {p}"></div>' for p in pages)
    return f'<div class="two-col">{cells}\n        </div>'

# ---------- build #modpyq ----------
cards = []
for m in (1,2,3,4,5):
    groups = []
    for base,label,tag,pages,qs in PAPERS:
        mqs = [q for q in qs if q['m']==m]
        if not mqs: continue
        rows = ''.join(qrow(q, base, label) for q in mqs)
        groups.append(
            f'\n      <div class="paper-group">\n        <h4>{label} <span class="tag">{tag}</span></h4>\n        '
            + thumbs(base,pages,label)
            + f'\n        <div class="table-wrap"><table>\n          <tr><th>Q.No</th><th>Marks</th><th>Question</th></tr>{rows}\n        </table></div>\n      </div>')
    n = sum(len([q for q in qs if q['m']==m]) for _,_,_,_,qs in PAPERS)
    cards.append(
        f'\n    <div class="modpyq-card">'
        f'\n      <div class="modpyq-head"><span class="mchip">{m}</span> <strong>{MODULES[m]}</strong> '
        f'<span class="tag">CO-{m}</span> <span class="tag tag-high">{n} PYQs</span></div>'
        + ''.join(groups) + '\n    </div>')

new_modpyq = ('\n'.join(cards) + '\n  ')

# splice: replace everything between the two section open tags
start = c.index('<section class="section section-alt" id="modpyq">') + len('<section class="section section-alt" id="modpyq">')
end = c.index('<section class="section section-alt" id="pyqs">')
c = c[:start] + new_modpyq + c[end:]

io.open(PATH, encoding='utf-8').read()

def R(no, marks, text, module, page):
    return {'no': no, 'marks': marks, 't': text, 'm': module, 'page': page}

# ================= CANONICAL FM DATA =================
# (qno, marks, text, module, page)
MID22 = [
 R('Q.1(a)',2,'Explain the importance of viscosity in fluid motion',1,1),
 R('Q.1(b)',3,'A square plate of size 1 m x 1 m and weighting 350 N slides down an incline plane with a uniform velocity of 1.5 m/s as shown in Figure below. The incline plane is laid on a slope of 5 vertical to 12 horizontal and has an oil film of 1 mm thickness. Determine the dynamic viscosity of oil in SI Unit',1,1),
 R('Q.2(a)',2,'What is a manometer? How are they classified?',1,1),
 R('Q.2(b)',3,'A U-Tube manometer is used to measure the pressure of water in a pipeline, which is in excess of atmospheric pressure. The right limb contains mercury and is open to atmosphere, the contact between water and mercury being in the left limb. If the difference in level of mercury in the limbs is 10 cm and the free surface of mercury is in level with the center of the pipeline as shown in Figure, determine the pressure of water in the main line',1,1),
 R('Q.3(a)',2,'Derive the continuity equation in differential form for a 2D flow in Cartesian coordinate system',2,2),
 R('Q.3(b)',3,'u = x\u00b3 + y\u00b2 + z\u00b2 ; v = xy\u00b2 \u2212 yz\u00b2 + xy. Determine the third component of velocity such that they satisfy the continuity equation',2,2),
 R('Q.4(a)',2,'Distinguish between (i) steady and un-steady flow, (ii) uniform and non-uniform flow, (iii) rotational and irrotational flow, (iv) laminar and turbulent flow',2,2),
 R('Q.4(b)',3,'A fluid flow is given by V = 8x\u00b3i \u2212 10x\u00b2yj. Determine the shear strain rate and state whether the flow is rotational or irrotational',2,2),
 R('Q.5(a)',2,'What do you understand by the term losses of energy of the flowing fluids in pipes',3,2),
 R('Q.5(b)',3,'A crude oil of kinematic viscosity 0.4 \u00d7 10\u207b\u2074 m\u00b2/s flows through a pipe of diameter 300 mm at a rate of 0.3 m\u00b3/s. Using Darcy-Weisbach equation, determine the head lost due to friction for a length of 50 m of the pipe. Given friction factor f = 0.079/(R<sub>e</sub>)^\u00bc, where R<sub>e</sub> is Reynolds Number',3,2),
]
END22 = [
 R('Q.1(a)',2,'Define the following terms: (i) Density, (ii) weight density, (iii) specific gravity, (iv) specific volume',1,1),
 R('Q.1(b)',3,'A plate 0.025 mm distant from a fixed plate moves at 60 cm/s and requires a force of 2 N/sq.m to maintain this speed. Determine the dynamic viscosity of the fluid between the plates',1,1),
 R('Q.1(c)',5,'An inverted differential manometer as shown in Fig. 1 connects two pipes A and B containing water; the manometric fluid is oil of sp. gr. 0.8. For the manometer readings shown, determine the difference of pressure head between A and B',1,1),
 R('Q.2(a)',2,'Distinguish between stream line, streak line and path line in a fluid flow',2,1),
 R('Q.2(b)',3,"Prove Bernoulli's theorem for fluid flow. Also state the assumptions being made",2,1),
 R('Q.2(c)',5,'A tapered horizontal pipe with inlet diameter 25 cm carries oil of sp. gr. 0.9 at a velocity of 3 m/s. The outlet diameter is 20 cm. Determine the velocity of oil at the outlet section and also the flow rate of oil through this tapered pipe',2,1),
 R('Q.3(a)',2,'Distinguish between major and minor losses in pipes',3,1),
 R('Q.3(b)',3,'What is a boundary layer? How does a boundary layer get separated from the boundary, and what are the standard ways to control the separation',3,1),
 R('Q.3(c)',5,'A horizontal pipe line 40 m long is connected to a tank at one end and discharges freely into the atmosphere at the other end (d\u2081 = 0.15 m, d\u2082 = 0.3 m, lengths per Fig. 2). The water level in the tank is 8 m above the pipe centerline. Take friction factor f = 0.01. Considering all losses of head, determine the rate of flow. Also draw the hydraulic gradient line and total energy line for this circuit',3,1),
 R('Q.4(a)',2,'Classify various types of hydro-turbines',4,2),
 R('Q.4(b)',3,'With a neat sketch explain the working of an inward flow reaction turbine',4,2),
 R('Q.4(c)',5,'Determine the power given by the jet of water to the runner of a Pelton wheel having tangential velocity 20 m/s. Net head on the turbine is 50 m and discharge through the jet is 0.03 m\u00b3/s. Blade angle at outlet with tangential direction \u03c6 = 15\u00b0. Take coefficient of velocity as 0.975',4,2),
 R('Q.5(a)',2,'Define the following terms for a centrifugal pump: (i) suction head, (ii) delivery head, (iii) static head, (iv) manometric head',5,2),
 R('Q.5(b)',3,'With a neat sketch describe the principle of working of a reciprocating pump',5,2),
 R('Q.5(c)',5,'A centrifugal pump has outer diameter equal to two times the inner diameter and runs at 1000 rpm against a total head of 40 m. Velocity of flow through the impeller is constant at 2.5 m/s. Vanes are set backwards at 40\u00b0 at outlet. Outer diameter 500 mm, width 50 mm. Determine (i) vane angle at inlet, (ii) work done by the impeller on water per second, (iii) manometric efficiency',5,2),
]
MID23 = [
 R('Q.1(a)',2,'Define the term continuum for fluids. What is its importance in fluid domain',1,1),
 R('Q.1(b)',3,'Determine the dynamic viscosity of an oil used for lubrication between a square plate 0.8 m x 0.8 m and an inclined plane at 30 degrees as shown in Figure. Weight of the plate is 300 N and it slides down with uniform velocity 0.3 m/s. Thickness of oil film is 1.5 mm',1,1),
 R('Q.2(a)',2,'What is the difference between U-tube differential manometer and inverted U-tube differential manometer? Where are they used?',1,1),
 R('Q.2(b)',3,'An inverted U-tube differential manometer is connected to two pipes A and B conveying water as shown in Figure. Manometric fluid is oil of specific gravity 0.8. For the manometer readings, determine the gauge pressure difference between A and B',1,1),
 R('Q.3(a)',2,'With a suitable sketch explain the term stream line in a fluid flow',2,1),
 R('Q.3(b)',3,'A fluid flow is given by V = (x\u00b2y)i + (y\u00b2z)j \u2212 (2xyz + yz\u00b2)k. Analyze this flow for its continuity and rotationality at point (2, 1, 3)',2,1),
 R('Q.4(a)',2,'Distinguish between laminar flow and turbulent flow',2,2),
 R('Q.4(b)',3,'The diameter of a pipe gradually reduces from 1 m to 0.7 m as shown in Figure. Pressure intensity at the centerline of the 1 m section is 7.848 kN/sq.m and rate of flow of water is 600 liters/second. Determine (i) pressure intensity at the centerline of the 0.7 m section, (ii) force exerted by the flowing fluid on the tapered portion (reducer) of the pipe',2,2),
 R('Q.5(a)',2,'Distinguish between major and minor losses in pipes',3,2),
 R('Q.5(b)',3,'Crude oil of kinematic viscosity 0.4 \u00d7 10\u207b\u2074 sq.m./sec flows through a 300 mm diameter pipe at 0.3 m\u00b3/sec. Determine (i) head loss due to friction for a 50 m length, (ii) Reynolds number of the flow. Take coefficient of friction as 0.006',3,2),
]
END23 = [
 R('Q.1(a)',5,"State and prove Pascal's law of static pressure",1,1),
 R('Q.1(b)',5,'A vertical gap 2.2 cm wide of infinite extent contains a fluid of viscosity 2.0 N-s/m\u00b2 and specific gravity 0.9. A metallic plate 1.2 m x 1.2 m x 0.2 cm is lifted at constant velocity 0.15 m/s through the middle of the gap. Determine the force required. Weight of the plate is 40 N',1,1),
 R('Q.2(a)',5,'Explain the following terms: (i) linear translation, (ii) angular deformation, (iii) rotation, and (v) vorticity of a fluid element',2,1),
 R('Q.2(b)',5,'A lawn sprinkler as shown in figure has 0.8 cm diameter nozzles at the ends of a rotating arm and discharges water at 10 m/s. Determine the torque required to hold the arm stationary. Also determine the constant speed of rotation if free to rotate',2,1),
 R('Q.3(a)',5,'What is an orifice meter? Prove that the discharge through an orifice meter is given by Q = C<sub>d</sub> \u00b7 (a\u2080\u00b7a\u2081/\u221a(a\u2081\u00b2 \u2212 a\u2080\u00b2)) \u00b7 \u221a(2gh), where a\u2081 = area of the pipe and a\u2080 = area of the orifice',3,1),
 R('Q.3(b)',5,'Determine the rate of flow of water through a pipe of diameter 20 cm and length 50 m, one end connected to a tank and other end open to atmosphere. Pipe is horizontal, water level in the tank is 4 m above the pipe centerline. Consider all minor losses and take f = 0.009 in Darcy-Weisbach equation. Also draw the Total Energy Line and Hydraulic Gradient Line',3,1),
 R('Q.4(a)',5,'A Francis turbine of overall efficiency 75% produces 148.25 kW under a head of 7.62 m. Peripheral velocity = 0.26(2gH)^0.5 and radial velocity of flow at inlet = 0.96(2gH)^0.5. Wheel runs at 150 rpm; hydraulic losses are 22% of available energy. Assuming radial discharge, determine (i) guide blade angle, (ii) wheel vane angle',4,2),
 R('Q.4(b)',5,'What is governing of a hydraulic turbine? Briefly explain the governing of an impulse turbine',4,2),
 R('Q.5(a)',5,'A centrifugal pump has outer diameter equal to two times the inner diameter and runs at 1000 rpm against a total head of 40 m. Flow velocity through the impeller is constant at 2.5 m/s. Vanes set backward at 40\u00b0 at outlet. Outer diameter 500 mm, width at outlet 50 mm. Determine work done by the impeller on water per second',5,2),
 R('Q.5(b)',5,'Briefly explain the working of a reciprocating pump',5,2),
]
MID24 = [
 R('Q.1(a)',2,'What does the term continuum signify in fluid dynamics? Justify your answer with suitable explanation',1,1),
 R('Q.1(b)',3,'Determine the specific weight, density and specific gravity of one litre of liquid which weighs 7 N',1,1),
 R('Q.2(a)',2,"Define Newton's Law of dynamic viscosity. How does the dynamic viscosity change with temperature for liquids",1,1),
 R('Q.2(b)',3,'Evaluate the capillary rise in a glass tube of 2.5 mm diameter when immersed vertically in (a) water and (b) Mercury. Surface tension \u03c3 = 0.0725 N/m for water and \u03c3 = 0.52 N/m for Mercury in contact with air; specific gravity of Mercury 13.6, angle of contact 130 degrees',1,1),
 R('Q.3(a)',2,'Explain with suitable sketch the Eulerian and Lagrangian description of fluid flow. How can they be related with each other',2,1),
 R('Q.3(b)',3,'Wind blows North to South from 11.00 AM to 11.30 AM and East to West from 11.30 AM to 12.00 Noon. Construct the STREAK LINE and visualize the flow using a time interval of 10 minutes',2,1),
 R('Q.4(a)',2,"Derive Euler's Equation of motion for fluid flow. Mention the assumptions made",2,1),
 R('Q.4(b)',3,'A fluid flow is given by V = 8x\u00b3i \u2212 10x\u00b2yj. Determine (i) shear strain rate, (ii) rotation or vorticity',2,1),
 R('Q.5(a)',2,'Distinguish between major and minor losses of energy in fluid flow through pipes',3,1),
 R('Q.5(b)',3,'An oil of specific gravity 0.7 flows through a 300 mm diameter pipe at 500 Liter/second. Evaluate head loss due to friction and power required to maintain the flow for a length of 1000 m. Kinematic viscosity 0.29 \u00d7 10\u207b\u2074 m\u00b2/s, friction factor f = 0.079/(R<sub>e</sub>)^0.25',3,1),
]
END24 = [
 R('Q.1(a)',5,'Velocity profile of a fluid over a plate is parabolic with vertex 20 cm from the plate where velocity is 120 cm/sec (Fig.). Determine velocity gradients and shear stresses at distances 0, 10 and 20 cm from the plate. Dynamic viscosity 0.85 N-s/m\u00b2',1,1),
 R('Q.1(b)',5,'Determine the differential reading (h) of an inverted tube manometer containing oil of specific gravity 0.7 connected across pipes A and B conveying liquids of specific gravities 1.2 and 1.0 (Fig.). Pipes are at the same level; pressures at A and B are equal',1,1),
 R('Q.2(a)',5,'Derive the expression for the continuity equation in the differential form \u2202u/\u2202x + \u2202v/\u2202y = 0',2,1),
 R('Q.2(b)',5,'A 30 cm x 15 cm Venturimeter is inserted in a vertical pipe carrying water, flow upwards; throat diameter 15 cm, pipe diameter 30 cm. Differential mercury manometer connected to inlet and throat reads 20 cm of mercury. Determine the discharge. Coefficient of discharge 0.98',2,2),
 R('Q.3(a)',5,'Using basic principles of fluid flow, derive the discharge expression for an Orifice-meter in the form Q = C<sub>d</sub> \u00b7 ((a\u2080a\u2081)/\u221a(a\u2081\u00b2 \u2212 a\u2080\u00b2)) \u00b7 \u221a(2gH), where a\u2081 = pipe area and a\u2080 = orifice area',3,2),
 R('Q.3(b)',5,'With suitable sketch explain the concept of boundary layer separation over a convex surface. How can the separation be controlled?',3,2),
 R('Q.4(a)',5,'What is governing? With a neat sketch explain the governing of a Pelton turbine',4,2),
 R('Q.4(b)',5,'A 137 mm diameter jet of water issuing from a nozzle impinges on a series of Pelton wheel buckets; relative velocity is deflected through 165\u00b0. Head at nozzle 400 m, coefficient of velocity 0.97, speed ratio 0.46, reduction in relative velocity through the bucket 15%. Evaluate (i) force exerted by the jet on buckets in the tangential direction, (ii) power developed',4,2),
 R('Q.5(a)',5,'With neat sketch explain the working of a single acting reciprocating pump fitted with air vessels. What happens if the air vessels are removed from the pump unit?',5,2),
 R('Q.5(b)',5,'A centrifugal pump discharges 0.15 m\u00b3/s against a head of 12.5 m at 600 rpm. Impeller outer/inner diameters 500 mm / 250 mm; vanes bent backwards at 35\u00b0 to the tangent at exit; flow area remains 0.07 sq.m from inlet to outlet. Evaluate (i) manometric efficiency, (ii) vane angle at inlet',5,2),
]
MID25 = [
 R('Q.1(a)',2,'Discuss the concept of continuum in fluid flow practices',1,1),
 R('Q.1(b)',3,'A plate 0.025 mm distant from a fixed plate moves at 0.6 m/s requiring a shear force per unit area of 2 N/m\u00b2. Determine the dynamic viscosity of the flowing fluid between the plates',1,1),
 R('Q.2(a)',2,'With suitable sketch discuss: (i) Piezometer, (ii) Differential U Tube manometer',1,1),
 R('Q.2(b)',3,'A rectangular plane surface 2 m wide and 3 m deep lies in a vertical plane in water. Determine total pressure and position of center of pressure when its upper edge is horizontal (Figure). Given h* = I\u1d04/(Ah\u0304) + h\u0304, where I\u1d04 is moment of inertia about the axis through C.G. parallel to base',1,1),
 R('Q.3(a)',2,'Distinguish between: (i) steady and unsteady flow, (ii) one, two and three dimensional flow',2,1),
 R('Q.3(b)',3,'Pipe diameters at sections 1 and 2 are D\u2081 = 10 cm and D\u2082 = 15 cm respectively. Determine the discharge if the velocity of water at section 1 is 5 m/s (Figure). Also determine the velocity at section 2',2,1),
 R('Q.4(a)',2,'Discuss the various forces present in a fluid flow when the fluid is a real one',2,2),
 R('Q.4(b)',3,"Using Navier-Stokes equation for inviscid, incompressible, irrotational and steady flow, develop (derive) Bernoulli's equation for total energy along a streamline",2,2),
 R('Q.5(a)',2,"Using Bernoulli's equation, develop a relation for theoretical discharge through a horizontal Venturi meter",3,2),
 R('Q.5(b)',3,'A horizontal Venturimeter with inlet and throat diameters 30 cm and 15 cm measures water flow. The differential U-tube manometer (mercury) connected to inlet and throat shows 20 cm mercury. Coefficient of discharge 0.98. Determine the rate of flow',3,2),
]
END25 = [
 R('Q.1(a)',5,'Define center of pressure and determine the total pressure on a circular plate of diameter 1.5 m placed vertically in water with its center 3.0 m below the free surface. Also determine the position of center of pressure',1,1),
 R('Q.1(b)',5,'A single column manometer is connected to a pipe containing liquid of specific gravity 0.9. Determine the pressure in the pipe if the reservoir area is 100 times the tube area for the manometer reading shown (Figure). Manometric fluid is mercury with specific gravity 13.6',1,1),
 R('Q.2(a)',5,"Derive Euler's equation of motion along a stream line. State the basic assumptions made to derive it",2,1),
 R('Q.2(b)',5,'The velocity components in a two-dimensional flow are u = y\u00b3/3 + 2x \u2212 x\u00b2y and v = xy\u00b2 \u2212 2y \u2212 x\u00b3/3. Determine whether the flow is rotational or irrotational',2,1),
 R('Q.3(a)',5,'What is Boundary Layer? Explain with a neat sketch the phenomenon of boundary layer separation. How can separation of boundary layer be controlled',3,1),
 R('Q.3(b)',5,'An orifice meter with orifice diameter 10 cm is inserted in a 20 cm diameter pipe. Pressure gauges upstream and downstream read 19.62 N/cm\u00b2 and 9.81 N/cm\u00b2 respectively. Coefficient of discharge of the orifice plate is 0.6. Determine the discharge through the pipe',3,1),
 R('Q.4(a)',5,'What is governing of a turbine? With a neat sketch explain the mechanism of governing of an impulse turbine',4,1),
 R('Q.4(b)',5,'Data for an inward flow reaction turbine: net head 60 m, speed 700 rpm, shaft power 294.3 kW, overall efficiency 84%, hydraulic efficiency 93%, flow ratio 0.2, breadth ratio 0.1, outer diameter = 2 \u00d7 inner diameter of runner. Vane thickness occupies 5% of circumferential area; velocity of flow constant at inlet and outlet; discharge radial at outlet. Draw velocity triangles and determine (i) guide blade angle, (ii) runner vane angles at inlet and outlet, (iii) runner diameter at inlet and outlet',4,1),
 R('Q.5(a)',5,'Explain with a neat sketch the working of a double acting reciprocating pump fitted with air vessels. Also draw its ideal indicator diagram',5,1),
 R('Q.5(b)',5,'What is cavitation? How is it different from priming? Clearly mention the effects of cavitation and precautions against cavitation of centrifugal pumps and turbines',5,1),
]

PAPERS = [
 ('FM_MO2022_MID','MID MO2022','MID',[1,2],MID22),
 ('FM_MO2022_END','END MO2022','END',[1,2],END22),
 ('FM_MO2023_MID','MID MO2023','MID',[1,2],MID23),
 ('FM_MO2023_END','END MO2023','END',[1,2],END23),
 ('FM_MO2024_P1','MID MO2024','MID',[1],MID24),
 ('FM_MO2024_P2','END MO2024','END',[1,2],END24),
 ('FM_MO2025_MID','MID MO2025','MID',[1,2],MID25),
 ('FM_MO2025_END','END MO2025','END',[1],END25),
]
MODULES = {1:'Fluid Statics',2:'Kinematics & Dynamics',3:'Closed Conduit Flow',4:'Hydraulic Turbines',5:'Pumps'}

def qrow(q, base, label):
    zoom = f'/api/file?path=images/papers/{base}_p{q["page"]}.png'
    cap = f'{q["no"]} \u00b7 {label} \u00b7 p{q["page"]}'
    return (f'\n          <tr><td><strong>{q["no"]}</strong></td><td>{q["marks"]}</td>'
            f'<td>{q["t"]} <span class="qzoom"><a class="qlink" data-zoom="{zoom}" '
            f'data-caption="{cap}">\U0001F4C4 p{q["page"]}</a></span></td></tr>')

def thumbs(base, pages, label):
    cells = ''.join(
        f'\n          <div class="paper-thumb" data-zoom="/api/file?path=images/papers/{base}_p{p}.png" '
        f'data-caption="{label} \u00b7 page {p}"><img src="/api/file?path=images/papers/{base}_p{p}.png" '
        f'alt="{label} paper page {p}"></div>' for p in pages)
    return f'<div class="two-col">{cells}\n        </div>'

# ---------- build #modpyq ----------
cards = []
for m in (1,2,3,4,5):
    groups = []
    for base,label,tag,pages,qs in PAPERS:
        mqs = [q for q in qs if q['m']==m]
        if not mqs: continue
        rows = ''.join(qrow(q, base, label) for q in mqs)
        groups.append(
            f'\n      <div class="paper-group">\n        <h4>{label} <span class="tag">{tag}</span></h4>\n        '
            + thumbs(base,pages,label)
            + f'\n        <div class="table-wrap"><table>\n          <tr><th>Q.No</th><th>Marks</th><th>Question</th></tr>{rows}\n        </table></div>\n      </div>')
    n = sum(len([q for q in qs if q['m']==m]) for _,_,_,_,qs in PAPERS)
    cards.append(
        f'\n    <div class="modpyq-card">'
        f'\n      <div class="modpyq-head"><span class="mchip">{m}</span> <strong>{MODULES[m]}</strong> '
        f'<span class="tag">CO-{m}</span> <span class="tag tag-high">{n} PYQs</span></div>'
        + ''.join(groups) + '\n    </div>')

new_modpyq = ('\n'.join(cards) + '\n  ')

# splice: replace everything between the two section open tags
start = c.index('<section class="section section-alt" id="modpyq">') + len('<section class="section section-alt" id="modpyq">')
end = c.index('<section class="section section-alt" id="pyqs">')
c = c[:start] + new_modpyq + c[end:]

io.open(PATH, 'w', encoding='utf-8').write(c)

# ---------- verify ----------
c = io.open(PATH, encoding='utf-8').read()
mpq = c[c.index('id="modpyq"'):c.index('id="pyqs"')]
print('modpyq cards:', mpq.count('class="modpyq-card"'))
print('paper-groups in modpyq:', mpq.count('class="paper-group"'))
for m in range(1,6):
    print(f'M{m} rows:', mpq.count(f'<span class="mchip">{m}</span> <strong>'))
