import re

with open('src/content/fm.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the cheat sheet section
start_marker = '<!-- ============ CHEAT SHEET ============ -->'
end_marker = '<!-- ===================== PYQs ===================== -->'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

new_cheat = '''<!-- ============ CHEAT SHEET ============ -->
      <div class="topic" id="cheat">
        <div class="topic-header">
          <h3>⚡ Quick Revision Cheat Sheet</h3>
        </div>
        <div class="subsection">
          <h4>Manometer Level-by-Level Tracing <span class="tag tag-crit">CRITICAL</span></h4>
          <p><strong>Core rule:</strong> Trace from point A to point B — <strong>add</strong> pressure going <strong>down</strong> into a fluid, <strong>subtract</strong> going <strong>up</strong>.</p>
          <div class="two-col">
            <div>
              <div class="formula-box"><strong>U-Tube Manometer (heavier fluid ρₘ):</strong><br>
p_A/γ + y_A + z_A = p_B/γ + y_B + z_B<br>
p_A = p_B + (ρₘ − ρ) g h</div>
              <div class="formula-box"><strong>Differential U-Tube (both pipes water, mercury):</strong><br>
p_A − p_B = (ρₘ − ρ) g h</div>
            </div>
            <div>
              <div class="formula-box"><strong>Inverted U-Tube (lighter fluid, oil):</strong><br>
p_A − p_B = (ρ_A − ρₘ) g h_A − (ρ_B − ρₘ) g h_B</div>
              <div class="formula-box"><strong>Single Column / Piezometer:</strong><br>
p = ρ g h  (open to atmosphere)</div>
            </div>
          </div>
        </div>
        <div class="subsection">
          <h4>Must-Know Formulas by Module</h4>
          <details open>
            <summary><strong>M1 — Fluid Statics</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Continuum:</strong> L ≫ λ (mean free path)</div>
                <div class="formula-box">ρ = m/V  ·  γ = ρg  ·  S = ρ/ρ_w</div>
                <div class="formula-box">τ = μ(du/dy)  ·  ν = μ/ρ</div>
                <div class="formula-box">h = 4σcosθ/(ρgd)  (capillary)</div>
                <div class="formula-box">p = γh = ρgh  (pressure at depth)</div>
              </div>
              <div>
                <div class="formula-box"><strong>Total pressure on plane:</strong> P = γA h̄</div>
                <div class="formula-box"><strong>Center of pressure:</strong> h* = h̄ + I_G/(A·h̄)</div>
                <div class="formula-box">Rectangle: h* = 2h/3 (top edge at surface)</div>
                <div class="formula-box">I_G: Rect = bd³/12  ·  Circle = πD⁴/64</div>
                <div class="formula-box">B = ρgV_disp  ·  GM = I_O/V − BG</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M2 — Kinematics & Dynamics</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Continuity (incompressible):</strong> ∂u/∂x + ∂v/∂y = 0</div>
                <div class="formula-box"><strong>Euler's equation:</strong> dp/ρ + g dz + v dv = 0</div>
                <div class="formula-box"><strong>Bernoulli:</strong> p/ρg + v²/2g + z = const</div>
                <div class="formula-box"><strong>Real fluid head loss:</strong> h_L added to RHS</div>
              </div>
              <div>
                <div class="formula-box"><strong>Flow types:</strong> Steady/Unsteady, Uniform/Non-uniform, Laminar/Turbulent, Rotational/Irrotational</div>
                <div class="formula-box"><strong>Velocity profile:</strong> V = 2x i − 2y j → ∇·V = 0 (continuity)</div>
                <div class="formula-box"><strong>Vorticity:</strong> ω = ∇ × V  (irrotational if ω = 0)</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M3 — Closed Conduit Flow</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Venturimeter:</strong> Q = C_d·a₁a₂/√(a₁²−a₂²)·√(2gh)</div>
                <div class="formula-box"><strong>Orifice meter:</strong> Q = C_d·a₀a₁/√(a₁²−a₀²)·√(2gh)</div>
                <div class="formula-box"><strong>Pitot tube:</strong> V = C_v√(2gh)</div>
                <div class="formula-box"><strong>Darcy–Weisbach:</strong> h_f = 4f·L·v²/(2g·d)</div>
              </div>
              <div>
                <div class="formula-box"><strong>Minor losses:</strong> h = k·v²/2g</div>
                <div class="formula-box">Sudden enlargement: h = (v₁−v₂)²/2g</div>
                <div class="formula-box">Sudden contraction: k ≈ 0.5</div>
                <div class="formula-box"><strong>Equivalent pipe (Dupuit):</strong> L_e = D⁵(L₁/D₁⁵ + L₂/D₂⁵)</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M4 — Hydraulic Turbines</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Impulse (Pelton):</strong> u = 0.45–0.5√(2gH)</div>
                <div class="formula-box"><strong>Reaction (Francis):</strong> Q = A·V_f</div>
                <div class="formula-box"><strong>Draft tube:</strong> recovers kinetic energy</div>
              </div>
              <div>
                <div class="formula-box"><strong>Specific speed:</strong> N_s = N√P/H^{5/4}</div>
                <div class="formula-box"><strong>Unit quantities:</strong> N_u = N/√H, Q_u = Q/√H</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M5 — Pumps</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Centrifugal:</strong> H_m = V_{w2}u_2/g  (Euler)</div>
                <div class="formula-box"><strong>Specific speed:</strong> N_s = N√Q/H^{3/4}</div>
                <div class="formula-box"><strong>NPSH:</strong> H_a − h_s − h_{f_s} − p_v/ρg</div>
              </div>
              <div>
                <div class="formula-box"><strong>Reciprocating:</strong> Discharge = A·L·N/60</div>
                <div class="formula-box"><strong>Slip:</strong> 1 − Q_actual/Q_theoretical</div>
                <div class="formula-box"><strong>Indicator diagram:</strong> work = area enclosed</div>
              </div>
            </div>
          </details>
        </div>
        <div class="subsection">
          <h4>Common Traps</h4>
          <ul>
            <li>Manometers: <strong>always add going down, subtract going up</strong>.</li>
            <li>Rectangular plate with top edge at free surface: <strong>h* = 2h/3</strong>.</li>
            <li>Metacentre: GM > 0 stable · GM = 0 neutral · GM < 0 unstable.</li>
            <li>Capillary rise negative sign = depression (mercury).</li>
            <li>Absolute = gauge + atmospheric (10.33 m water / 760 mm Hg / 1.01325 bar).</li>
            <li>Liquids μ ↓ with T ↑; gases μ ↑ with T ↑.</li>
            <li>Inverted U-tube → light manometric fluid; small Δp.</li>
            <li>Orifice meter C_d ≈ 0.6, Venturimeter C_d ≈ 0.98.</li>
            <li>Bernoulli assumptions: inviscid, steady, along streamline, incompressible.</li>
            <li>Continuity equation is mass balance — check ∂ρ/∂t = 0 for incompressible.</li>
          </ul>
        </div>
        <div class="subsection">
          <h4>Weightage Summary</h4>
          <div class="table-wrap"><table>
            <tr><th>Topic</th><th>Marks/Paper</th><th>Frequency</th></tr>
            <tr><td>Center of Pressure</td><td>5–7</td><td>Every paper</td></tr>
            <tr><td>Manometers</td><td>5</td><td>Every paper</td></tr>
            <tr><td>Viscosity</td><td>3</td><td>90% papers</td></tr>
            <tr><td>Bernoulli / Euler</td><td>5</td><td>Every END sem</td></tr>
            <tr><td>Venturi / Orifice meter</td><td>5</td><td>80% papers</td></tr>
            <tr><td>Continuum</td><td>2</td><td>100% mids</td></tr>
            <tr><td>Total pressure on surfaces</td><td>5</td><td>High</td></tr>
            <tr><td>Buoyancy & Metacentre</td><td>5</td><td>Mid/End</td></tr>
          </table></div>
        </div>
        <div class="subsection">
          <h4>⛔ Out of Syllabus (Prof's Pruned Bansal List)</h4>
          <p style="font-size:0.9em;color:var(--muted,#666)">Skip these — even where old MO papers touched them, confirm with your professor:</p>
          <ul>
            <li>Ch.1 §1.4.2–1.4.4, 1.5 · Ch.2 §2.8.1–2.8.4</li>
            <li>Ch.3 probs 3.7–3.13 & textbook pp 83–125</li>
            <li>Ch.5 §5.6.1, 5.8.2–5.8.5, 5.10.3–5.10.6 & probs 5.5A, 5.10, 5.20–5.32</li>
            <li>Ch.6 §6.10 · Ch.7 §7.5 & probs 7.8–7.29 · Ch.9 §9.4–9.8</li>
            <li>Ch.10 — only §10.1, 10.2, 10.4 · Ch.11 §11.6, 11.12 & listed probs</li>
            <li>Ch.13 — only listed theory + prob 13.8 · <strong>Ch.8 & 12 fully out</strong></li>
          </ul>
        </div>
      </div>'''

new_content = content[:start_idx] + new_cheat + content[end_idx:]

with open('src/content/fm.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("FM cheat sheet updated successfully!")