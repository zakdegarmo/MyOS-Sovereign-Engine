"""
kinematic_mcp_server.py
Model Context Protocol (MCP) server that gives the GameMaster (orchestrator)
and any local/cloud AI agent kinematic embodiment in MyOS.
Exposes semantic search and real-time motion triggering across the 2,317-clip library.
"""

import sys
import os
import json

# Ensure user site-packages are accessible
if sys.platform == "win32":
    sys.path.append(r"C:\Users\zakde\AppData\Roaming\Python\Python313\site-packages")
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("[ERROR] 'mcp' package not installed. Kinematic MCP server cannot start.", file=sys.stderr)
    sys.exit(1)

from query_kinematic_lexicon import query_actions, ensure_baked_clip, ensure_filmed_spritesheet

mcp = FastMCP("myos-kinematic-engine")

@mcp.tool()
async def search_embodied_action(intent: str, body_mask: str = "", top_k: int = 5) -> str:
    """
    Search the 2,317 Kinematic Lexicon actions using semantic intent embeddings.
    
    Args:
        intent: Natural language description of the agent's intent or physical reaction
                (e.g., "indifferent shrug", "nodding in agreement", "inspecting broken engine", "celebratory victory jump")
        body_mask: Optional filter: "upper_only" (for gestures while walking/sitting) or "full_body"
        top_k: Number of matching actions to return (default: 5)
        
    Returns:
        JSON list of candidate actions with titles, scores, categories, .blend studios, and 2D spritesheet URLs.
    """
    mask_filter = body_mask if body_mask in ["upper_only", "full_body"] else None
    matches = query_actions(intent, body_mask_filter=mask_filter, top_k=top_k)
    return json.dumps(matches, indent=2)

@mcp.tool()
async def trigger_embodied_action(action_id: str) -> str:
    """
    Triggers a chosen embodied action for the agent's avatar.
    Ensures the .blend filming studio is baked, and auto-films the 8-directional 2D spritesheet
    if not already cached, returning the 2D sprite sheet URL ready for immediate canvas/Sprite Lab playback.
    
    Args:
        action_id: The ID of the action (e.g. "Acknowledging", "Agreeing", "Dismissing_Gesture")
        
    Returns:
        JSON payload ready for 2D Sprite Engine / Canvas avatar playback.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sheet_rel = f"/actions/mannequin_{action_id.lower()}_loop.png"

    item = {
        "id": action_id,
        "baked_blend": os.path.join("assets", "motion_library", "baked", f"{action_id}.blend"),
        "raw_fbx": os.path.join("assets", "motion_library", "raw_fbx", "animation_motion", f"{action_id}.fbx")
    }
    
    sheet_path = ensure_filmed_spritesheet(item, resolution=256)
    if not sheet_path:
        return json.dumps({"status": "error", "message": f"Failed to film 2D sprite sheet for action: {action_id}"})
        
    payload = {
        "status": "ready",
        "action_id": action_id,
        "spritesheet_url": sheet_rel,
        "studio_blend": f"assets/motion_library/baked/{action_id}.blend",
        "grid": {"cols": 8, "rows": 8},
        "tile_size": 256,
        "event": "DISPATCH_EMBODIED_2D_SPRITE"
    }
    return json.dumps(payload, indent=2)

if __name__ == "__main__":
    mcp.run(transport='stdio')
