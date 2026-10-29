import re

def update_file():
    with open("apps/web/src/components/World/CyclotropeMenu3D.tsx", "r") as f:
        content = f.read()

    # 1. Remove SCHOOLS and LEVELS constants
    content = re.sub(r"const SCHOOLS = \[.*?\];\n", "", content, flags=re.DOTALL)
    content = re.sub(r"const LEVELS = \[.*?\];\n", "", content, flags=re.DOTALL)

    # 2. Replace state variables
    content = content.replace(
        "const [schoolIdx, setSchoolIdx] = useState(0);\n    const [levelIdx, setLevelIdx] = useState(0);",
        "const [letterIdx, setLetterIdx] = useState(0);"
    )

    # 3. Add letters and activeSpells useMemos
    old_active_spells = """    const activeSpells = useMemo(() => 
        spellDatabase.filter(s => s.school === SCHOOLS[schoolIdx] && s.level === LEVELS[levelIdx])
    , [spellDatabase, schoolIdx, levelIdx]);"""
    
    new_active_spells = """    const letters = useMemo(() => {
        const set = new Set<string>();
        spellDatabase.forEach(s => { if (s.name) set.add(s.name.charAt(0).toUpperCase()); });
        return Array.from(set).sort();
    }, [spellDatabase]);

    const activeSpells = useMemo(() => {
        if (letters.length === 0) return [];
        const selectedLetter = letters[letterIdx] || 'A';
        return spellDatabase.filter(s => s.name && s.name.charAt(0).toUpperCase() === selectedLetter);
    }, [spellDatabase, letters, letterIdx]);"""
    content = content.replace(old_active_spells, new_active_spells)

    # 4. Update setIsOpen reset
    content = content.replace(
        "setActiveRing(0); setCategoryIdx(0); setSchoolIdx(0); setLevelIdx(0); setSpellIdx(0);",
        "setActiveRing(0); setCategoryIdx(0); setLetterIdx(0); setSpellIdx(0);"
    )

    # 5. Update dependencies
    content = content.replace(
        "isOpen, activeRing, categoryIdx, schoolIdx, levelIdx, spellIdx, activeSpells, onSelectSpell",
        "isOpen, activeRing, categoryIdx, letterIdx, spellIdx, activeSpells, onSelectSpell"
    )

    # 6. Update Numpad logic
    old_keys_logic = """            if (e.code === 'Numpad4') { 
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
                
    new_keys_logic = """            if (e.code === 'Numpad4') { 
                if (activeRing === 0) setCategoryIdx(p => (p - 1 + CATEGORIES.length) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) setLetterIdx(p => (p - 1 + letters.length) % letters.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p - 1 + activeSpells.length) % activeSpells.length);
            } else if (e.code === 'Numpad6') { 
                if (activeRing === 0) setCategoryIdx(p => (p + 1) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) setLetterIdx(p => (p + 1) % letters.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p + 1) % activeSpells.length);
            } else if (e.key === 'Enter' || e.code === 'Numpad5' || e.code === 'NumpadEnter') {
                if (activeRing === 0 && categoryIdx !== 0) {
                    // Block deeper traversal if not Spells for now
                    console.log('Not implemented yet');
                } else if (activeRing < 2) {
                    setActiveRing(p => p + 1);
                    setSpellIdx(0);
                    setSpinVelocity(1.0); 
                } else if (activeSpells.length > 0) {
                    onSelectSpell(activeSpells[spellIdx].id);
                    setIsOpen(false);
                }"""
    content = content.replace(old_keys_logic, new_keys_logic)

    # 7. Update useFrame targetRot
    old_target = """        let targetRot = 0;
        if (activeRing === 0) targetRot = -categoryIdx * (Math.PI * 2 / CATEGORIES.length);
        if (activeRing === 1 && categoryIdx === 0) targetRot = -schoolIdx * (Math.PI * 2 / SCHOOLS.length);
        if (activeRing === 2 && categoryIdx === 0) targetRot = -levelIdx * (Math.PI * 2 / LEVELS.length);
        if (activeRing === 3 && activeSpells.length > 0) targetRot = -spellIdx * (Math.PI * 2 / activeSpells.length);"""
        
    new_target = """        let targetRot = 0;
        if (activeRing === 0) targetRot = -categoryIdx * (Math.PI * 2 / CATEGORIES.length);
        if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) targetRot = -letterIdx * (Math.PI * 2 / letters.length);
        if (activeRing === 2 && activeSpells.length > 0) targetRot = -spellIdx * (Math.PI * 2 / activeSpells.length);"""
    content = content.replace(old_target, new_target)
    
    # 8. Update ActiveColor
    content = content.replace(
        """const activeColor = activeRing === 0 ? "#ffff00" : activeRing === 1 ? "#aa88ff" : activeRing === 2 ? "#00ffff" : "#ff3366";""",
        """const activeColor = activeRing === 0 ? "#ffff00" : activeRing === 1 ? "#00ffff" : "#ff3366";"""
    )

    # 9. Update JSX mapping
    old_jsx = """                {/* Ring 1: Schools */}
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
                
    new_jsx = """                {/* Ring 1: A-Z Alphabet */}
                {categoryIdx === 0 && letters.map((letter, i) => (
                    <SpinTextItem 
                        key={letter} text={letter} index={i} total={letters.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 1} 
                        activeColor="#00ffff" 
                    />
                ))}

                {/* Ring 2: Spell Cards */}
                {activeRing === 2 && activeSpells.length === 0 && (
                    <group position={[0, 0, -haloRadius + 0.1]}>
                        <Billboard follow lockX={false} lockY={false} lockZ={false}>
                            <Text fontSize={0.2} color="#ff3333" anchorY="bottom">No Spells Found</Text>
                        </Billboard>
                    </group>
                )}
                {categoryIdx === 0 && activeSpells.map((spell, i) => (
                    <SpinCardItem 
                        key={spell.id} data={spell} index={i} total={activeSpells.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 2} 
                    />
                ))}"""
    content = content.replace(old_jsx, new_jsx)

    with open("apps/web/src/components/World/CyclotropeMenu3D.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    update_file()
