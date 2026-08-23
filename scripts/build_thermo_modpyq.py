# -*- coding: utf-8 -*-
"""Insert #modpyq (PYQs by Module) into thermo.html from canonical transcription
of every Thermo paper MO2022-MO2025."""
import io

PATH = 'src/content/thermo.html'

def R(no, marks, text, module, page):
    return {'no': no, 'marks': marks, 't': text, 'm': module, 'page': page}

MID22 = [
 R('Q.1(a)',2,'Outline the importance of quasi-static process from thermodynamics point of view',1,1),
 R('Q.1(b)',3,'A tank has two rooms separated by a membrane. Room A contains 2 kg of air with specific volume 0.5 m\u00b3/kg, while room B has 0.75 m\u00b3 of air with density 0.8 kg/m\u00b3. The membrane breaks and the two masses come to a uniform state. Find the final specific volume of air',1,1),
 R('Q.2(a)',2,'How will you distinguish between point function and path function? Explain with suitable example',1,1),
 R('Q.2(b)',3,'Dry steam at 10 bar is cooled at constant volume to 3 bar. Determine the dryness fraction after cooling',2,1),
 R('Q.3(a)',2,'Under what condition is the work done equal to \u222bp\u00b7dV ?',1,1),
 R('Q.3(b)',3,'A gas is compressed from V\u2081 = 0.09 m\u00b3 to V\u2082 = 0.03 m\u00b3. The relation between pressure and volume during the process is p = 14V + 2.44, where p is in bar and V in m\u00b3. Find the work done in kJ',2,1),
 R('Q.4(a)',2,'Show that internal energy is a property of the system',2,1),
 R('Q.4(b)',3,'Two insulated tanks A and B are connected by a valve. Tank A: 0.6 m\u00b3 of air at 200 kPa, 200 \u00b0C. Tank B: 0.3 m\u00b3 of air at 500 kPa, 130 \u00b0C. The valve is opened fully and the tanks come to a uniform state. Determine the final pressure',2,1),
 R('Q.5',5,'Steam at 4 MPa, 400 \u00b0C enters a turbine with velocity 15 m/s. Heat loss through the casing is 60 kW. Steam leaves at 0.1 bar, 0.91 dry with velocity 65 m/s. Elevation difference between inlet and outlet pipes is 2 m. Determine the power developed for a steam flow rate of 50000 kg/hr',2,1),
]
END22 = [
 R('Q.1(a)',2,'Indicate which of the following properties are intensive and which are extensive: (i) Density (ii) Potential Energy (iii) Enthalpy (iv) Pressure',1,1),
 R('Q.1(b)',3,'A 1 m\u00b3 rigid tank has air at 100 kPa, 300 K connected by a valve to another 0.5 m\u00b3 tank with air at 250 kPa, 400 K. The valve is opened and the tanks come to a uniform state at 315 K. Determine the final pressure',1,1),
 R('Q.1(c)',5,'A constant pressure piston/cylinder assembly contains 0.2 kg of steam at 400 kPa, 220 \u00b0C. It is cooled so that the volume reduces to half the original. Estimate the work done in the process',2,1),
 R('Q.2(a)',2,'State the first law of thermodynamics applied to (i) a process and (ii) a cycle',2,1),
 R('Q.2(b)',3,'One kg of air at 7 bar, 90 \u00b0C undergoes a polytropic process represented by pV^1.1 = constant till the pressure falls to 1.4 bar. Determine (i) final temperature, (ii) final volume, (iii) heat transferred',2,1),
 R('Q.2(c)',5,'Steam enters a nozzle with negligible velocity at 3 MPa, 320 \u00b0C and leaves at 1.6 MPa with velocity 550 m/s. Rate of flow of steam is 0.5 kg/s. Determine the condition of steam at the nozzle exit and the nozzle exit area',2,1),
 R('Q.3(a)',2,'State the difference between refrigerator and heat pump',3,1),
 R('Q.3(b)',3,'State and explain Carnot theorem',3,1),
 R('Q.3(c)',5,'An ice plant working on a reversed Carnot cycle produces 20 tonnes of ice per day from water at 0 \u00b0C, maintained at 0 \u00b0C; heat is rejected to atmosphere at 27 \u00b0C. The heat pump runs on a Carnot engine absorbing heat from a source at 227 \u00b0C and rejecting heat to atmosphere at 27 \u00b0C. Compute the heat supplied to the engine (enthalpy of fusion of ice = 334.5 kJ/kg)',3,1),
 R('Q.4(a)',2,'Show that entropy is a property of a system',4,1),
 R('Q.4(b)',3,'Explain entropy principle',4,1),
 R('Q.4(c)',5,"Estimate the change in entropy of the universe for: (i) a copper block of 600 gm mass, Cp = 150 J/K at 100 \u00b0C placed in a lake at 8 \u00b0C, (ii) two such blocks at 100 \u00b0C and 0 \u00b0C joined together",4,1),
 R('Q.5(a)',5,'Derive an expression for the ideal efficiency of an air standard diesel cycle',5,1),
 R('Q.5(b)',5,'An engine working on the Otto cycle has volume 0.5 m\u00b3, pressure 1 bar and temperature 27 \u00b0C at the beginning of compression. At the end of compression the pressure is 10 bar. Heat added during constant volume process is 200 kJ. Determine (a) percentage clearance volume, (b) air standard efficiency, (c) mean effective pressure',5,1),
]
MID23 = [
 R('Q.1(a)',2,'Explain work from thermodynamics point of view',1,1),
 R('Q.1(b)',3,'Explain: (i) intensive and extensive properties, (ii) free expansion process',1,1),
 R('Q.2',5,'A 1 m\u00b3 rigid tank has air at 15 bar and ambient temperature 27 \u00b0C connected by a valve to a piston cylinder. The piston of area 0.1 m\u00b2 requires 2.5 bar below it to float. The valve is opened and the piston moves slowly 2 m up, then the valve is closed. Temperature remains 27 \u00b0C throughout. Evaluate the final pressure in the tank',1,1),
 R('Q.3(a)',2,'Determine the temperature of water at a state of P = 0.5 MPa and h = 2890 kJ/kg',2,1),
 R('Q.3(b)',3,'Determine the amount of heat to be supplied to 2 kg of water at 25 \u00b0C to convert it to steam at 5 bar and 0.9 dry',2,1),
 R('Q.4(a)',2,'Explain the First Law of Thermodynamics for the cycle and the non-cyclic process',2,1),
 R('Q.4(b)',3,'For a polytropic process pV^n = constant, prove that \u222b\u2081\u00b2 \u03b4Q = ((\u03b3 \u2212 n)/(\u03b3 \u2212 1)) \u00d7 polytropic work done',2,1),
 R('Q.5',5,'Fluid parameters at the inlet of a steam nozzle: enthalpy 2850 kJ/kg, velocity 50 m/s, area 0.1 m\u00b2, specific volume 0.18 m\u00b3/kg. At discharge: enthalpy 2650 kJ/kg, specific volume 0.49 m\u00b3/kg. Evaluate (i) velocity of steam, (ii) mass flow rate, (iii) exit area of the nozzle. Nozzle horizontal; heat loss negligible',2,1),
]
MID24P1 = [
 R('Q.1(a)',2,'Thermodynamics can be studied by adopting either a macroscopic or a microscopic approach. Distinguish between the macroscopic and microscopic approach',1,1),
 R('Q.1(b)',3,'A system of volume V contains mass m of gas at pressure P and temperature T obeying (p + a/V\u00b2)(v \u2212 b) = mRT, where a, b, R are constants. Obtain an expression for the displacement work during constant temperature expansion from V\u2081 to V\u2082. Calculate the work for 10 kg of this gas expanding from 1 m\u00b3 to 10 m\u00b3 at 293 K, with a = 15.7\u00d710\u2074 Nm\u2074, b = 1.07\u00d710\u207b\u00b2 m\u00b3 and R = 0.278 kJ/kg-K',2,1),
 R('Q.2(a)',2,'What is meant by thermodynamic equilibrium? How does it differ from thermal equilibrium?',1,1),
 R('Q.2(b)',3,'The pressure-volume correlation for a non-flow reversible (quasi-static) process is P = (8 \u2212 4V) bar, where V is in m\u00b3. If 150 kJ of work is supplied to the system, determine the final pressure and volume. Take initial volume = 0.6 m\u00b3',2,1),
 R('Q.3(a)',2,'What is meant by a pure substance? Can we treat air as a pure substance?',1,1),
 R('Q.3(b)',3,'Explain the first law of thermodynamics when it is applied to a closed system undergoing change of state',2,1),
 R('Q.4(a)',2,'Define internal energy of a system and show that internal energy is a property of the system',2,1),
 R('Q.4(b)',3,'A gas of mass 1.5 kg undergoes quasi-static expansion following p = a + bV. Initial/final pressures 1000 kPa / 200 kPa; corresponding volumes 0.20 m\u00b3 / 1.2 m\u00b3. Specific internal energy is given by u = 1.5pv \u2212 85 kJ/kg (p in kPa, v in m\u00b3/kg). Calculate the net heat transfer and the maximum internal energy attained during expansion',2,1),
 R('Q.5(a)',2,'Derive the expression for steady flow energy equation',2,1),
 R('Q.5(b)',3,'A gas undergoes a thermodynamic cycle: (i) 1-2 constant pressure = 1.4 bar, V\u2081 = 0.028 m\u00b3, W\u2081\u2082 = 10.5 kJ; (ii) 2-3 compression with PV = constant, U\u2083 = U\u2082; (iii) 3-1 constant volume, U\u2081 \u2212 U\u2083 = \u221226.4 kJ; neglect KE and PE changes. (a) Sketch the cycle on P-V diagram, (b) calculate net work for the cycle in kJ, (c) calculate heat transfer for process 1-2, (d) show that \u2211Q = \u2211W over the cycle',2,2),
]
END24P2 = [
 R('Q.1(a)',5,'What is a process? Explain the meaning of quasi-static process and also state its characteristic features',1,1),
 R('Q.1(b)',5,'An ideal gas is heated at constant volume until its temperature is 3 times the original, then expanded isothermally till it reaches its original pressure, then cooled at constant pressure till restored to original state. Determine the net work done per kg if initial temperature is 350 K',2,1),
 R('Q.2(a)',5,'Derive an expression for heat transfer in a polytropic process',2,1),
 R('Q.2(b)',5,'Dry saturated steam at 5 bar enters an adiabatic nozzle at velocity 2 m/s and leaves as dry saturated steam at 2 bar. Calculate the exit velocity of the steam',2,1),
 R('Q.3(a)',5,'Define and compare C.O.P. of a heat pump with that of a refrigerator',3,1),
 R('Q.3(b)',5,'If 20 kJ are added to a Carnot cycle at 100 \u00b0C and 14.6 kJ are rejected at 0 \u00b0C, determine the location of absolute zero on the Celsius scale. Assume \u03a6(t) = at + b',3,1),
 R('Q.4(a)',5,'State and prove the Clausius inequality',4,1),
 R('Q.4(b)',5,'A heat engine is supplied 278 kJ/s of heat at fixed temperature 283 \u00b0C with heat rejection at 5 \u00b0C. Reported results: (i) 208 kJ/s rejected, (ii) 139 kJ/s rejected, (iii) 70 kJ/s rejected. Classify each as reversible, irreversible or impossible',4,1),
 R('Q.5(a)',5,'Derive the expression for thermal efficiency of the Otto cycle',5,1),
 R('Q.5(b)',5,'In an air standard Otto cycle, compression ratio is 7 and compression begins at 35 \u00b0C, 0.1 MPa. Maximum temperature of the cycle is 1100 \u00b0C. Find (i) temperature and pressure at the cardinal points, (ii) heat supplied per kg of air, (iii) work done per kg of air, (iv) cycle efficiency, (v) m.e.p.',5,1),
]
MID25 = [
 R('Q.1(a)',2,'Thermodynamics can be studied by adopting either a macroscopic or a microscopic approach. Distinguish both approaches with examples of properties involved',1,1),
 R('Q.1(b)',3,'A balloon filled with air (200 kPa / 300 K) becomes a sphere of diameter 1 m. It is gradually heated till its pressure rises to 500 kPa. Determine the work done, assuming pressure inside is proportional to diameter',2,1),
 R('Q.2(a)',2,'What is a process? Explain the meaning of quasi-static process and state its characteristic features',1,1),
 R('Q.2(b)',3,'An ideal gas is heated at constant volume until its temperature is 3 times the original, then expanded isothermally till it reaches its original pressure, then cooled at constant pressure till restored to original state. Determine the net work done per kg if initial temperature is 350 K',2,1),
 R('Q.3(a)',2,'What are point and path functions? Illustrate that both work and heat are path functions and not point functions',1,1),
 R('Q.3(b)',3,'Show that the enthalpy of a fluid before throttling equals that after throttling (h\u2081 = h\u2082)',2,1),
 R('Q.4(a)',2,'Define internal energy and specific heats of a system',2,1),
 R('Q.4(b)',3,'A gas of mass 1.5 kg undergoes quasi-static expansion following p = a + bV. Initial/final pressures 1000 kPa / 200 kPa; volumes 0.20 m\u00b3 / 1.2 m\u00b3. Specific internal energy u = 1.5pv \u2212 85 kJ/kg (p in kPa, v in m\u00b3/kg). Calculate net heat transfer and maximum internal energy attained during expansion',2,1),
 R('Q.5(a)',2,'Derive an expression for work done in a polytropic process',2,1),
 R('Q.5(b)',3,'Dry saturated steam at 5 bar enters an adiabatic nozzle at 2 m/s and leaves as dry saturated steam at 2 bar. Calculate the exit velocity of the steam',2,1),
]
END25 = [
 R('Q.1(a)',5,'Comment whether the following can be called properties or not: (i) \u222bp dV, (ii) \u222bV dp, (iii) \u222bp dV + \u222bV dp, (iv) v\u00b7(dv/\u2202T)\u209a + v\u00b7(dv/\u2202v)\u209a for PV=RT, (v) (1/T)\u00b7dH \u2212 (v/T)\u00b7dV for PV=RT',1,1),
 R('Q.1(b)',5,'A piston cylinder device contains 0.8 kg of steam at 300 \u00b0C and 1 MPa. Steam is cooled at constant pressure until one-half of the mass condenses. (a) Show the process on a T-V diagram, (b) find the final temperature, (c) determine the volume change',2,1),
 R('Q.2(a)',5,'Make an energy analysis of the: (i) Nozzle, (ii) Throttling device, (iii) Turbine and Compressor',2,1),
 R('Q.2(b)',5,'In a steam power plant, saturated liquid water at 10 kPa enters a feed pump at 1 kg/s. The pump delivers water to the boiler at 3 MPa. Assuming the pump is adiabatic, estimate the power input to the pump',2,1),
 R('Q.3(a)',5,'Establish the equivalence of Kelvin-Planck and Clausius statements',3,1),
 R('Q.3(b)',5,'A reversible power cycle drives a reversible heat pump. The power cycle takes in Q\u2081 at T\u2081 and rejects Q\u2082 at T\u2082; the heat pump abstracts Q\u2082 from the sink at T\u2082 and discharges Q\u2083 at T\u2083. Develop an expression for the ratio Q\u2083/Q\u2081 in terms of the four temperatures',3,1),
 R('Q.4(a)',5,'State and prove the Clausius inequality',4,1),
 R('Q.4(b)',5,'0.2 kg of air at 300 \u00b0C is heated reversibly at constant pressure to 2066 K. Find the available and unavailable energies of the heat added. Take T\u2080 = 30 \u00b0C and Cp = 1.0047 kJ/kgK',4,1),
 R('Q.5(a)',5,'Explain how the Clausius-Clapeyron equation helps in determining the slope of the phase boundary between liquid and vapor phases of a substance',4,1),
 R('Q.5(b)',5,'Describe the Joule-Thomson coefficient and explain how it indicates whether a gas will cool or heat upon expansion',4,1),
]

PAPERS = [
 ('THERMO_MO2022_MID','MID MO2022','MID',[1],MID22),
 ('THERMO_MO2022_END','END MO2022','END',[1],END22),
 ('THERMO_MO2023_MID','MID MO2023','MID',[1],MID23),
 ('THERMO_MO2024_P1','MID MO2024','MID',[1,2],MID24P1),
 ('THERMO_MO2024_P2','END MO2024','END',[1],END24P2),
 ('THERMO_MO2025_MID','MID MO2025','MID',[1],MID25),
 ('THERMO_MO2025_END','END MO2025','END',[1],END25),
]
MODULES = {1:'Basic Concepts',2:'First Law of Thermodynamics',3:'Second Law',4:'Entropy & Availability',5:'Gas Power Cycles'}

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
assert c.find('id="modpyq"') == -1, 'modpyq already present'
c = c[:anchor] + section + c[anchor:]
io.open(PATH, 'w', encoding='utf-8').write(c)

seg = c[c.index('id="modpyq"'):c.index('id="pyqs"')]
print('cards:', seg.count('class="modpyq-card"'), '| groups:', seg.count('paper-group'))
total = sum(len(qs) for _, _, _, _, qs in PAPERS)
print('total questions:', total)
