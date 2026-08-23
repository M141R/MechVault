import re

with open('src/content/thermo.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- ============ CHEAT SHEET ============ -->'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found!")
    exit(1)

# Find the end of the cheat section - search for the closing of the cheat topic div
cheat_section_end = content.find('      </div>\n\n    </main>', start_idx)
if cheat_section_end == -1:
    cheat_section_end = content.find('      </div>', start_idx + 1000)

new_cheat = '''<!-- ============ CHEAT SHEET ============ -->
      <div class="topic" id="cheat">
        <div class="topic-header">
          <h3>⚡ Quick Revision Cheat Sheet</h3>
        </div>
        <div class="subsection">
          <h4>Must-Know Formulas by Module</h4>
          <details open>
            <summary><strong>M1 — Fundamental Concepts & First Law</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Thermodynamic definitions:</strong><br>
System / Surroundings / Control Volume<br>
State / Process / Cycle<br>
Point function (property) vs Path function (δQ, δW)</div>
                <div class="formula-box"><strong>Zeroth Law & Ideal Gas:</strong><br>
PV = mRT = nR̄T<br>
Pure substance phases: compressed liquid, saturated mix, superheated vapor</div>
                <div class="formula-box"><strong>Work & Heat:</strong><br>
W = ∫P dV (boundary work)<br>
δQ = T dS (reversible)<br>
Free expansion: W=0, Q=0, ΔU=0 (ideal gas)</div>
                <div class="formula-box"><strong>First Law (closed system):</strong><br>
ΔU = Q − W<br>
For cycle: ∮δQ = ∮δW</div>
              </div>
              <div>
                <div class="formula-box"><strong>Enthalpy & Specific Heats:</strong><br>
h = u + Pv<br>
c_p − c_v = R,  γ = c_p/c_v</div>
                <div class="formula-box"><strong>First Law (control volume - SFEE):</strong><br>
Q̇ − Ẇ = ṁ[Δh + ΔV²/2 + gΔz]</div>
                <div class="formula-box"><strong>Steady-flow devices:</strong><br>
Nozzle: h₁ + V₁²/2 = h₂ + V₂²/2<br>
Turbine: Ẇ = ṁ(h₁−h₂)<br>
Compressor: Ẇ = ṁ(h₂−h₁)<br>
Throttling: h₁ = h₂ (isenthalpic)</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M2 — Second Law & Entropy</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Heat Engine / Fridge / HP:</strong><br>
η = W_net / Q_H = 1 − Q_L/Q_H<br>
COP_R = Q_L / W_net = T_L/(T_H−T_L)<br>
COP_HP = Q_H / W_net = COP_R + 1</div>
                <div class="formula-box"><strong>Carnot efficiency:</strong><br>
η_Carnot = 1 − T_L/T_H  (T in Kelvin)<br>
Carnot COP_R = T_L/(T_H−T_L)</div>
                <div class="formula-box"><strong>Clausius Inequality & Entropy:</strong><br>
∮δQ/T ≤ 0<br>
dS = δQ_rev/T ≥ δQ/T</div>
              </div>
              <div>
                <div class="formula-box"><strong>Entropy change (ideal gas):</strong><br>
Δs = c_v ln(T₂/T₁) + R ln(v₂/v₁)<br>
Δs = c_p ln(T₂/T₁) − R ln(P₂/P₁)</div>
                <div class="formula-box"><strong>Isentropic relations:</strong><br>
T₂/T₁ = (P₂/P₁)^((γ−1)/γ) = (v₁/v₂)^(γ−1)<br>
P v^γ = const</div>
                <div class="formula-box"><strong>Availability (Exergy):</strong><br>
ϕ = (u−u₀) + P₀(v−v₀) − T₀(s−s₀)<br>
Available = Q(1 − T₀/T)  (heat source at T)</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M3 — Properties of Pure Substances</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Phase change:</strong><br>
x = m_vapor / m_total (quality)<br>
v = v_f + x·v_fg<br>
h = h_f + x·h_fg<br>
s = s_f + x·s_fg</div>
                <div class="formula-box"><strong>Steam tables usage:</strong><br>
Given T or P → get v_f, v_g, h_f, h_g, s_f, s_g<br>
Given h, s → find T, P, x</div>
              </div>
              <div>
                <div class="formula-box"><strong>Compressed liquid approx:</strong><br>
v ≈ v_f@T, h ≈ h_f@T + v_f(P−P_sat@T)<br>
s ≈ s_f@T</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M4 — Thermodynamic Cycles</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Otto cycle (SI engine):</strong><br>
1-2: Isentropic compression<br>
2-3: Constant volume heat addition<br>
3-4: Isentropic expansion<br>
4-1: Constant volume heat rejection</div>
                <div class="formula-box"><strong>Otto efficiency:</strong><br>
η_Otto = 1 − 1/r^(γ−1)<br>
r = V_max/V_min (compression ratio)</div>
                <div class="formula-box"><strong>Diesel cycle (CI engine):</strong><br>
1-2: Isentropic compression<br>
2-3: Constant pressure heat addition<br>
3-4: Isentropic expansion<br>
4-1: Constant volume heat rejection</div>
                <div class="formula-box"><strong>Diesel efficiency:</strong><br>
η_Diesel = 1 − [ρ^γ−1]/[r^(γ−1)·γ(ρ−1)]<br>
ρ = V₃/V₂ (cutoff ratio)</div>
              </div>
              <div>
                <div class="formula-box"><strong>Dual cycle:</strong><br>
Part constant volume, part constant pressure heat addition<br>
η_Dual = 1 − (1/r^(γ−1))·[(αβ−1)/((α−1)+γα(β−1))]<br>
α = P₃/P₂, β = V₃/V₂</div>
                <div class="formula-box"><strong>Comparison at same r:</strong><br>
η_Otto > η_Dual > η_Diesel</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M5 — Property Relations & Advanced Topics</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Maxwell relations:</strong><br>
(∂T/∂v)_s = −(∂P/∂s)_v<br>
(∂T/∂P)_s = (∂v/∂s)_P<br>
(∂s/∂v)_T = (∂P/∂T)_v<br>
(∂s/∂P)_T = −(∂v/∂T)_P</div>
                <div class="formula-box"><strong>Clausius–Clapeyron:</strong><br>
dP/dT = h_fg / [T(v_g−v_f)]</div>
                <div class="formula-box"><strong>Joule–Thomson coefficient:</strong><br>
μ_JT = (∂T/∂P)_h = [T(∂v/∂T)_P − v] / c_p<br>
μ_JT > 0 → cooling, < 0 → heating</div>
              </div>
              <div>
                <div class="formula-box"><strong>Heat capacity difference:</strong><br>
c_p − c_v = −T(∂P/∂T)_v² / (∂P/∂v)_T<br>
= T v α² / κ_T</div>
                <div class="formula-box"><strong>Polytropic process (PVⁿ = const):</strong><br>
W = mR(T₁−T₂)/(n−1)  (n≠1)<br>
W = mRT ln(V₂/V₁)  (n=1, isothermal)<br>
Q = W·(γ−n)/(γ−1)</div>
              </div>
            </div>
          </details>
        </div>
        <div class="subsection">
          <h4>Process Summary Table</h4>
          <div class="table-wrap"><table>
            <tr><th>Process</th><th>Constant</th><th>Work</th><th>Heat</th></tr>
            <tr><td>Isobaric</td><td>P</td><td>W = PΔV = mRΔT</td><td>Q = m c_p ΔT</td></tr>
            <tr><td>Isochoric</td><td>V</td><td>W = 0</td><td>Q = m c_v ΔT</td></tr>
            <tr><td>Isothermal</td><td>T</td><td>W = mRT ln(V₂/V₁)</td><td>Q = W</td></tr>
            <tr><td>Adiabatic</td><td>s, PV^γ</td><td>W = mR(T₁−T₂)/(γ−1)</td><td>Q = 0</td></tr>
            <tr><td>Polytropic</td><td>PVⁿ</td><td>W = mR(T₁−T₂)/(n−1)</td><td>Q = W·(γ−n)/(γ−1)</td></tr>
            <tr><td>Throttling</td><td>h</td><td>W = 0</td><td>Q = 0</td></tr>
          </table></div>
        </div>
        <div class="subsection">
          <h4>Common Traps</h4>
          <ul>
            <li>Enthalpy H is extensive; specific enthalpy h is intensive.</li>
            <li>Free expansion: W = 0, Q = 0, ideal gas T unchanged.</li>
            <li>Work and heat are path functions (δW, δQ); always in J not J/kg unless specified.</li>
            <li>Use kelvin in all entropy, efficiency and Carnot calculations.</li>
            <li>Throttling: h₁ = h₂ (isenthalpic) — not isothermal.</li>
            <li>COP_HP = COP_R + 1 — always larger.</li>
            <li>Entropy of universe ≥ 0 for all real processes.</li>
            <li>Polytropic: n = γ → adiabatic; n = 1 → isothermal (use special formulas for isothermal W = P₁V₁ ln(V₂/V₁)).</li>
            <li>In SFEE, ΔKE and ΔPE often negligible but include when nozzle/diffuser mentioned.</li>
            <li>For cycles, net work = area enclosed on P-V or T-s diagram.</li>
          </ul>
        </div>
        <div class="subsection">
          <h4>Weightage Summary</h4>
          <div class="table-wrap"><table>
            <tr><th>Topic</th><th>Marks/Paper</th><th>Frequency</th></tr>
            <tr><td>Polytropic process (work/heat)</td><td>3–5</td><td>Every paper</td></tr>
            <tr><td>SFEE / nozzle numerical</td><td>3–5</td><td>Every paper</td></tr>
            <tr><td>First law & internal energy</td><td>2–5</td><td>90% papers</td></tr>
            <tr><td>Second law / Carnot</td><td>5</td><td>Every END sem</td></tr>
            <tr><td>Entropy / Clausius</td><td>5</td><td>Every END sem</td></tr>
            <tr><td>Otto / Diesel cycle</td><td>5</td><td>Every END sem</td></tr>
            <tr><td>Intensive vs extensive</td><td>2</td><td>High (MID + END)</td></tr>
            <tr><td>Availability / exergy</td><td>3–5</td><td>END sem</td></tr>
            <tr><td>Maxwell relations / Clausius–Clapeyron</td><td>3–5</td><td>END sem</td></tr>
          </table></div>
        </div>
      </div>'''

# Find the exact end of the cheat section
cheat_section_end = content.find('      </div>\n\n    </main>', start_idx)
if cheat_section_end == -1:
    cheat_section_end = content.find('      </div>', start_idx + 1000)

new_content = content[:start_idx] + new_cheat + content[cheat_section_end:]

with open('src/content/thermo.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Thermo cheat sheet updated successfully!")