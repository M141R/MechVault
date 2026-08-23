import re

with open('src/content/som.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- ============ CHEAT SHEET ============ -->'
end_marker = '    </main>'

# Find the last occurrence of end_marker since it appears multiple times
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found!")
    exit(1)

# Find the end of the cheat section - it ends before the main closing tag
# Let's find the closing </div> of the cheat topic
cheat_end = content.find('      </div>\n\n    </main>', start_idx)
if cheat_end == -1:
    # Try alternative
    cheat_end = content.find('      </div>\n\n    </main>', start_idx)
if cheat_end == -1:
    # Search for the pattern
    parts = content[start_idx:].split('      </div>')
    if len(parts) > 2:
        cheat_end = start_idx + len(parts[0]) + len('      </div>')
    else:
        print("Could not find cheat end")
        exit(1)

new_cheat = '''<!-- ============ CHEAT SHEET ============ -->
      <div class="topic" id="cheat">
        <div class="topic-header">
          <h3>⚡ Quick Revision Cheat Sheet</h3>
        </div>
        <div class="subsection">
          <h4>Must-Know Formulas by Module</h4>
          <details open>
            <summary><strong>M1 — Stresses & Strains (Stress Transformation)</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Stress on inclined plane θ:</strong><br>
σ_θ = (σₓ+σᵧ)/2 + (σₓ−σᵧ)/2 cos2θ + τₓᵧ sin2θ<br>
τ_θ = (σₓ−σᵧ)/2 sin2θ − τₓᵧ cos2θ</div>
                <div class="formula-box"><strong>Principal stresses:</strong><br>
σ₁,₂ = σ_avg ± R<br>
σ_avg = (σₓ+σᵧ)/2<br>
R = √[((σₓ−σᵧ)/2)² + τₓᵧ²]</div>
                <div class="formula-box"><strong>Principal plane orientation:</strong><br>
tan 2θ_p = 2τₓᵧ/(σₓ−σᵧ)</div>
                <div class="formula-box"><strong>Max shear stress:</strong><br>
τ_max = R = (σ₁−σ₂)/2<br>
Planes at 45° to principal planes</div>
              </div>
              <div>
                <div class="formula-box"><strong>Mohr's Circle (Pytel convention):</strong><br>
Centre C = (σ_avg, 0), Radius R = τ_max<br>
Plot X = (σₓ, τₓᵧ), Y = (σᵧ, −τₓᵧ)<br>
τ positive = clockwise moment</div>
                <div class="formula-box"><strong>Strain transformation:</strong><br>
ε_θ = (εₓ+εᵧ)/2 + (εₓ−εᵧ)/2 cos2θ + (γₓᵧ/2) sin2θ<br>
(γ/2)_θ = −(εₓ−εᵧ)/2 sin2θ + (γₓᵧ/2) cos2θ</div>
                <div class="formula-box"><strong>Strain rosettes:</strong><br>
Rectangular (45°): εₓ=ε₀, εᵧ=ε₉₀, γₓᵧ=2ε₄₅−ε₀−ε₉₀<br>
Delta (60°): γₓᵧ = (2/√3)(ε₆₀−ε₁₂₀)</div>
                <div class="formula-box"><strong>Generalized Hooke's Law (plane stress):</strong><br>
εₓ = (σₓ−νσᵧ)/E, εᵧ = (σᵧ−νσₓ)/E<br>
γₓᵧ = τₓᵧ/G, G = E/2(1+ν)</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M2 — Bending & Shear</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Load–SF–BM relations:</strong><br>
dV/dx = −w(x)<br>
dM/dx = V(x)</div>
                <div class="formula-box"><strong>Flexure formula:</strong><br>
M/I = σ/y = E/R<br>
σ = M·y/I, σ_max = M/Z</div>
                <div class="formula-box"><strong>Section modulus:</strong><br>
Rectangle: Z = bd²/6<br>
Circle: Z = πd³/32</div>
                <div class="formula-box"><strong>Shear stress in beams:</strong><br>
τ = V·Aȳ/(I·b)<br>
Rectangle: τ = (3V/2bd)[1 − 4y²/d²]<br>
τ_max (NA) = 3V/(2bd) = 1.5 τ_avg</div>
              </div>
              <div>
                <div class="formula-box"><strong>SFD/BMD shapes:</strong><br>
Point load: SF jump, BM linear<br>
UDL: SF linear, BM parabolic<br>
Couple: BM jump</div>
                <div class="formula-box"><strong>Sign convention:</strong><br>
Upward force left → +V<br>
Sagging moment → +M</div>
              </div>
            </div>
          </details>
          <details open>
            <summary><strong>M3 — Deflection & Columns</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Macaulay's method:</strong><br>
EI d²y/dx² = M(x)<br>
⟨x−a⟩ⁿ = 0 if x<a, else (x−a)ⁿ</div>
                <div class="formula-box"><strong>Standard deflections:</strong><br>
Cantilever + end P: δ = PL³/3EI<br>
Cantilever + UDL: δ = wL⁴/8EI<br>
SS + central P: δ = PL³/48EI<br>
SS + UDL: δ = 5wL⁴/384EI</div>
                <div class="formula-box"><strong>Moment-area theorems:</strong><br>
θ_AB = ∫(M/EI)dx (area)<br>
t_BA = ∫(M/EI)·x dx (1st moment)</div>
              </div>
              <div>
                <div class="formula-box"><strong>Euler buckling:</strong><br>
P_cr = π²EI/L_eff²</div>
                <div class="formula-box"><strong>Effective lengths:</strong><br>
Pinned–Pinned: L<br>
Fixed–Free: 2L<br>
Fixed–Fixed: L/2<br>
Fixed–Pinned: L/√2 ≈ 0.707L</div>
                <div class="formula-box"><strong>Slenderness ratio:</strong> λ = L_eff/k<br>
k = √(I/A) (radius of gyration)</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M3b — Torsion of Circular Shafts</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Torsion formula:</strong><br>
T/J = τ/r = Gθ/L</div>
                <div class="formula-box"><strong>Polar moment J:</strong><br>
Solid: J = πd⁴/32<br>
Hollow: J = π(dₒ⁴−dᵢ⁴)/32</div>
              </div>
              <div>
                <div class="formula-box"><strong>Power:</strong> P = 2πNT/60 (N in rpm)</div>
                <div class="formula-box"><strong>Angle of twist:</strong> θ = TL/GJ</div>
                <div class="formula-box"><strong>Combined bending + torsion:</strong><br>
T_e = √(M²+T²), M_e = (M+√(M²+T²))/2</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M4 — Curved Beams & Shear Center</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Curved beam stress:</strong><br>
σ = M·y / [A·e·(R_n−y)]<br>
R_n = A / ∫(dA/r)<br>
e = R_c − R_n</div>
                <div class="formula-box"><strong>Rectangular section:</strong><br>
R_n = h / ln(R_o/R_i)<br>
Inner fibre stress = maximum</div>
              </div>
              <div>
                <div class="formula-box"><strong>Shear center (C-channel):</strong><br>
e = 3b²/(6b+h)  [thin-walled]<br>
b = flange width, h = web depth</div>
                <div class="formula-box"><strong>Strain energy:</strong><br>
Axial: U = P²L/2AE<br>
Bending: U = ∫M²/2EI dx<br>
Torsion: U = T²L/2GJ</div>
              </div>
            </div>
          </details>
          <details>
            <summary><strong>M5 — Thin & Thick Cylinders</strong></summary>
            <div class="two-col">
              <div>
                <div class="formula-box"><strong>Thin cylinder (t < d/20):</strong><br>
σ_h = pd/(2t)  (hoop)<br>
σ_l = pd/(4t)  (longitudinal)<br>
τ_max = pd/(8t)</div>
                <div class="formula-box"><strong>Thin cylinder strains:</strong><br>
ε_h = (σ_h−νσ_l)/E = pd(2−ν)/(4tE)</div>
              </div>
              <div>
                <div class="formula-box"><strong>Lame's equations (thick):</strong><br>
σ_r = A − B/r²<br>
σ_t = A + B/r²<br>
A = (P_i·r_i² − P_o·r_o²)/(r_o²−r_i²)<br>
B = r_i²·r_o²·(P_i−P_o)/(r_o²−r_i²)</div>
                <div class="formula-box"><strong>Shrink fit pressure:</strong><br>
p = δ / [ (r_p/E_o)((r_o²+r_p²)/(r_o²−r_p²)+ν_o) + (r_p/E_i)((r_p²+r_i²)/(r_p²−r_i²)−ν_i) ]</div>
              </div>
            </div>
          </details>
        </div>
        <div class="subsection">
          <h4>Common Traps</h4>
          <ul>
            <li>τ is max at the <strong>neutral axis</strong>, zero at the fibres; σ is max at the fibres, zero at NA.</li>
            <li>Buckling occurs about the <strong>weaker</strong> axis (smaller I).</li>
            <li>Principal planes → τ = 0. Max shear planes → 45° from principal.</li>
            <li>Thick cylinder stresses are max at the <strong>inner</strong> surface.</li>
            <li>Sign convention: compressive σ negative — keep signs through Mohr's circle.</li>
            <li>Euler valid only for slender columns; short columns crush.</li>
            <li>Macaulay brackets: integrate as (x−a)ⁿ with brackets intact; only expand for x ≥ a.</li>
            <li>Shear stress in rectangular beam: τ = 0 at top/bottom, max at NA (1.5×avg).</li>
            <li>Curved beam: neutral axis shifts toward center of curvature; stress hyperbolic.</li>
            <li>Mohr's circle for strain: plot (εₓ, γₓᵧ/2) and (εᵧ, −γₓᵧ/2).</li>
          </ul>
        </div>
        <div class="subsection">
          <h4>Weightage Summary</h4>
          <div class="table-wrap"><table>
            <tr><th>Topic</th><th>Marks/Paper</th><th>Frequency</th></tr>
            <tr><td>Inclined-plane / principal stress</td><td>5</td><td>Every paper</td></tr>
            <tr><td>Shear stress in beam (derivation)</td><td>5</td><td>2/3 papers</td></tr>
            <tr><td>Euler buckling + limitations</td><td>5</td><td>Every END sem</td></tr>
            <tr><td>Thin/thick cylinders</td><td>5–6</td><td>Every END sem</td></tr>
            <tr><td>Flexure formula</td><td>5</td><td>2/3 papers</td></tr>
            <tr><td>Macaulay deflection</td><td>5–6</td><td>Every END sem</td></tr>
            <tr><td>Stress transformation / Mohr's circle</td><td>5</td><td>Every paper</td></tr>
            <tr><td>Curved beams / shear center</td><td>5</td><td>END sem</td></tr>
          </table></div>
        </div>
      </div>'''

# Find the exact end of the cheat section - search for the closing of the cheat topic div
# The cheat section ends with "      </div>\n\n    </main>"
cheat_section_end = content.find('      </div>\n\n    </main>', start_idx)
if cheat_section_end == -1:
    # Try without the newlines
    cheat_section_end = content.find('      </div>', start_idx + len(new_cheat))

new_content = content[:start_idx] + new_cheat + content[cheat_section_end:]

with open('src/content/som.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SOM cheat sheet updated successfully!")