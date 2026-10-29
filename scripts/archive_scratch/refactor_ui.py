import re

def update_file():
    with open("apps/web/src/components/World/CyclotropeMenu3D.tsx", "r") as f:
        content = f.read()

    # Add CATEGORIES
    content = content.replace(
        "const SCHOOLS =", 
        "const CATEGORIES = ['Spells', 'Combat Actions', 'Bonus Actions', 'Movement', 'Inventory', 'Skills'];\nconst SCHOOLS ="
    )

    # Add categoryIdx state
    content = content.replace(
        "const [schoolIdx, setSchoolIdx] = useState(0);",
        "const [categoryIdx, setCategoryIdx] = useState(0);\n    const [schoolIdx, setSchoolIdx] = useState(0);"
    )

    # Update setIsOpen reset
    content = content.replace(
        "setActiveRing(0); setSchoolIdx(0); setLevelIdx(0); setSpellIdx(0);",
        "setActiveRing(0); setCategoryIdx(0); setSchoolIdx(0); setLevelIdx(0); setSpellIdx(0);"
    )

    # Update dependencies
    content = content.replace(
        "isOpen, activeRing, schoolIdx, levelIdx, spellIdx, activeSpells, onSelectSpell",
        "isOpen, activeRing, categoryIdx, schoolIdx, levelIdx, spellIdx, activeSpells, onSelectSpell"
    )

    # Update keys logic
    keys_logic_old = """            if (e.code === 'Numpad4') { 
                if (activeRing === 0) setSchoolIdx(p => (p - 1 + SCHOOLS.length) % SCHOOLS.length);
                if (activeRing === 1) setLevelIdx(p => (p - 1 + LEVELS.length) % LEVELS.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p - 1 + activeSpells.length) % activeSpells.length);
            } else if (e.code === 'Numpad6') { 
                if (activeRing === 0) setSchoolIdx(p => (p + 1) % SCHOOLS.length);
                if (activeRing === 1) setLevelIdx(p => (p + 1) % LEVELS.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p + 1) % activeSpells.length);
            } else if (e.key === 'Enter' || e.code === 'Numpad5' || e.code === 'NumpadEnter') {
                if (activeRing < 2) {
                    setActiveRing(p => p + 1);
                    setSpellIdx(0);
                    // Add a vertical pop effect to the velocity
                    setSpinVelocity(1.0); 
                } else if (activeSpells.length > 0) {
                    onSelectSpell(activeSpells[spellIdx].id);
                    setIsOpen(false);
                }"""
    
    keys_logic_new = """            if (e.code === 'Numpad4') { 
                if (activeRing === 0) setCategoryIdx(p => (p - 1 + CATEGORIES.length) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0) setSchoolIdx(p => (p - 1 + SCHOOLS.length) % SCHOOLS.length);
                if (activeRing === 2 && categoryIdx === 0) setLevelIdx(p => (p - 1 + LEVELS.length) % LEVELS.length);
                if (activeRing === 3 && activeSpells.length > 0) setSpellIdx(p => (p - 1 + activeSpells.length) % activeSpells.length);
            } else if (e.code === 'Numpad6') { 
                if (activeRing === 0) setCategoryIdx(p => (p + 1) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0) setSchoolIdx(p => (p + 1) % SCHOOLS.length);
                if (activeRing === 2 && categoryIdx === 0) setLevelIdx(p => (p + 1) % LEVELS.length);
                if (activeRing === 3 && activeSpells.length > 0) setSpellIdx(p => (p + 1) % activeSpells.length);
            } else if (e.key === 'Enter' || e.code === 'Numpad5' || e.code === 'NumpadEnter') {
                if (activeRing === 0 && categoryIdx !== 0) {
                    // Block deeper traversal if not Spells for now
                    console.log('Not implemented yet');
                } else if (activeRing < 3) {
                    setActiveRing(p => p + 1);
                    setSpellIdx(0);
                    setSpinVelocity(1.0); 
                } else if (activeSpells.length > 0) {
                    onSelectSpell(activeSpells[spellIdx].id);
                    setIsOpen(false);
                }"""
                
    content = content.replace(keys_logic_old, keys_logic_new)

    # Update useFrame targets
    frame_old = """        if (activeRing === 0) targetRot = schoolIdx * (Math.PI * 2 / SCHOOLS.length);
        if (activeRing === 1) targetRot = levelIdx * (Math.PI * 2 / LEVELS.length);
        if (activeRing === 2 && activeSpells.length > 0) targetRot = spellIdx * (Math.PI * 2 / activeSpells.length);"""
        
    frame_new = """        if (activeRing === 0) targetRot = categoryIdx * (Math.PI * 2 / CATEGORIES.length);
        if (activeRing === 1 && categoryIdx === 0) targetRot = schoolIdx * (Math.PI * 2 / SCHOOLS.length);
        if (activeRing === 2 && categoryIdx === 0) targetRot = levelIdx * (Math.PI * 2 / LEVELS.length);
        if (activeRing === 3 && activeSpells.length > 0) targetRot = spellIdx * (Math.PI * 2 / activeSpells.length);"""
        
    content = content.replace(frame_old, frame_new)

    # Update ActiveColor
    content = content.replace(
        """const activeColor = activeRing === 0 ? "#aa88ff" : activeRing === 1 ? "#00ffff" : "#ff3366";""",
        """const activeColor = activeRing === 0 ? "#ffff00" : activeRing === 1 ? "#aa88ff" : activeRing === 2 ? "#00ffff" : "#ff3366";"""
    )

    # Update JSX mapping
    jsx_old = """                {/* Ring 0: Schools */}
                {SCHOOLS.map((school, i) => (
                    <SpinTextItem 
                        key={school} text={school} index={i} total={SCHOOLS.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 0} 
                        activeColor="#aa88ff" 
                    />
                ))}

                {/* Ring 1: Levels */}
                {LEVELS.map((level, i) => (
                    <SpinTextItem 
                        key={level} text={level} index={i} total={LEVELS.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 1} 
                        activeColor="#00ffff" 
                    />
                ))}

                {/* Ring 2: Spell Cards */}
                {activeRing === 2 && activeSpells.length === 0 && (
                    <group position={[0, 0, -haloRadius + 0.1]}>
                        <Text fontSize={0.2} color="#ff3333" anchorY="bottom">No Spells Found</Text>
                    </group>
                )}
                {activeSpells.map((spell, i) => (
                    <SpinCardItem 
                        key={spell.id} data={spell} index={i} total={activeSpells.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 2} 
                    />
                ))}"""
                
    jsx_new = """                {/* Ring 0: Categories */}
                {CATEGORIES.map((cat, i) => (
                    <SpinTextItem 
                        key={cat} text={cat} index={i} total={CATEGORIES.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 0} 
                        activeColor="#ffff00" 
                    />
                ))}

                {/* Ring 1: Schools */}
                {categoryIdx === 0 && SCHOOLS.map((school, i) => (
                    <SpinTextItem 
                        key={school} text={school} index={i} total={SCHOOLS.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 1} 
                        activeColor="#aa88ff" 
                    />
                ))}

                {/* Ring 2: Levels */}
                {categoryIdx === 0 && LEVELS.map((level, i) => (
                    <SpinTextItem 
                        key={level} text={level} index={i} total={LEVELS.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 2} 
                        activeColor="#00ffff" 
                    />
                ))}

                {/* Ring 3: Spell Cards */}
                {activeRing === 3 && activeSpells.length === 0 && (
                    <group position={[0, 0, -haloRadius + 0.1]}>
                        <Billboard follow lockX={false} lockY={false} lockZ={false}>
                            <Text fontSize={0.2} color="#ff3333" anchorY="bottom">No Spells Found</Text>
                        </Billboard>
                    </group>
                )}
                {categoryIdx === 0 && activeSpells.map((spell, i) => (
                    <SpinCardItem 
                        key={spell.id} data={spell} index={i} total={activeSpells.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 3} 
                    />
                ))}"""
                
    content = content.replace(jsx_old, jsx_new)
    
    with open("apps/web/src/components/World/CyclotropeMenu3D.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    update_file()
