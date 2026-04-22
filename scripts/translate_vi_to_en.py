from pathlib import Path

REPLACEMENTS = {
    "frontend/src/components/WorkflowBuilderHeader.tsx": [
        ("Campaign Mode - Chỉnh sửa Script", "Campaign Mode - Edit Script"),
    ],
    "frontend/src/components/atlas/todo/ActionReadyHeader.tsx": [
        (
            "Không có action mới — đang có ${existingCount} action cũ cần xử lý",
            "No new actions — there are ${existingCount} existing actions to handle",
        ),
        ("Phân tích xong — không có action mới", "Analysis complete — no new actions"),
    ],
    "frontend/src/pages/Atlas.tsx": [
        ("Bạn đã nói gì?", "What did you say?"),
        ("Bạn nên nói gì?", "What should you say?"),
    ],
    "frontend/src/components/atlas/MemorySignalsBar.tsx": [
        (
            '/** Chỉ 1 dòng: số item tối đa hiển thị (phần còn lại vào "Show more"). */',
            '/** Single row: maximum number of visible items (the rest go into "Show more"). */',
        ),
        (
            "/** Giới hạn ký tự mỗi item trên strip. */",
            "/** Character limit for each item on the strip. */",
        ),
        (
            "{/* Row 2: Chỉ 1 dòng, không xuống dòng; mỗi item giới hạn ký tự */}",
            "{/* Row 2: Single line, no wrapping; each item has a character limit */}",
        ),
    ],
    "frontend/src/pages/auth/OAuthDone.tsx": [
        (
            "// Bất kể lần đăng nhập thứ mấy: nếu chưa đủ thông tin (terms/gdpr) thì luôn qua welcome → supplement-profile",
            "// Regardless of login count: if profile info is incomplete (terms/gdpr), always go through welcome → supplement-profile",
        ),
    ],
    "frontend/src/lib/api.ts": [
        (
            "/** Lưu danh sách meeting khi load lịch; trùng id thì update */",
            "/** Save meeting list when loading calendar; update if id already exists */",
        ),
    ],
    "frontend/src/pages/WorkflowBuilder.tsx": [
        ("// Chỉ cho phép edit script, không edit structure", "// Only allow script editing, not structure editing"),
        ("// Zoom nhỏ lại 1.75 lần (khoảng 0.57)", "// Zoomed out by 1.75x (approximately 0.57)"),
        ("// Connection label mặc định", "// Default connection label"),
        ("// Drag states - đơn giản và rõ ràng", "// Drag states - simple and clear"),
        ("// Giới hạn history tối đa 50 bước", "// Limit history to a maximum of 50 steps"),
        ("// Chỉ save history khi kết thúc drag (trong mouseUp)", "// Only save history when drag ends (in mouseUp)"),
        (
            "// Tăng khoảng cách giữa các nodes để có nhiều không gian hơn và đường kết nối dài hơn",
            "// Increase spacing between nodes for more space and longer connector paths",
        ),
        ("// Center nodes trên màn hình khi load (sau khi DOM đã render)", "// Center nodes on screen when loading (after DOM render)"),
        ("// Tính toán bounding box của nodes", "// Calculate node bounding box"),
        ("// 312 là node width", "// 312 is node width"),
        ("// 120 là node height", "// 120 is node height"),
        ("// Tính pan để center nodes", "// Calculate pan to center nodes"),
        ("// Center nodes trên màn hình khi load", "// Center nodes on screen when loading"),
        ("// Handle node mouse down - bắt đầu drag node trên canvas", "// Handle node mouse down - start dragging node on canvas"),
        ("// Không drag nếu click vào button hoặc connection point", "// Do not drag when clicking a button or connection point"),
        ("// Tính toán offset từ vị trí chuột đến góc trên trái của node", "// Calculate offset from mouse position to the node's top-left corner"),
        ("// Ưu tiên panning trước", "// Prioritize panning first"),
        ("// Nếu đang drag node", "// If currently dragging a node"),
        ("// Tính toán vị trí mới của node (không giới hạn)", "// Calculate node's new position (unbounded)"),
        ("// Nếu đang kết nối", "// If currently connecting"),
        ("// Không pan nếu đang drag node", "// Do not pan while dragging a node"),
        ("// Middle mouse button hoặc Space + Left click hoặc Right click để pan", "// Use middle mouse, Space + left click, or right click to pan"),
        ("// Kết thúc panning", "// End panning"),
        ("// Nếu đang drag node, save vào history khi kết thúc", "// If dragging a node, save to history when finished"),
        ("// Refs để lưu giá trị mới nhất của zoom và pan cho wheel handler", "// Refs to store latest zoom and pan values for wheel handler"),
        ("// Cập nhật refs khi zoom hoặc pan thay đổi", "// Update refs when zoom or pan changes"),
        ("// Handle wheel zoom và pan - using native event listener to allow preventDefault", "// Handle wheel zoom and pan - using native event listener to allow preventDefault"),
        ("// Sử dụng refs để lấy giá trị mới nhất mà không cần re-register listener", "// Use refs to get latest values without re-registering listener"),
        ("// Ctrl + Wheel hoặc Cmd + Wheel để zoom", "// Ctrl + Wheel or Cmd + Wheel to zoom"),
        ("// Zoom point (vị trí chuột trên canvas trong không gian đã zoom)", "// Zoom point (mouse position on canvas in zoomed space)"),
        ("// Tính zoom mới", "// Calculate new zoom"),
        ("// Điều chỉnh pan để zoom point giữ nguyên vị trí trên màn hình", "// Adjust pan so the zoom point stays in the same screen position"),
        ("// Wheel thông thường = pan", "// Regular wheel = pan"),
        ("// Empty dependency array - chỉ register một lần", "// Empty dependency array - register only once"),
        ("// Handle canvas drop - nhận node từ sidebar", "// Handle canvas drop - receive node from sidebar"),
        ("// Lưu label đã chọn", "// Save selected label"),
        ("// Space để pan - but not when typing in input/textarea", "// Space to pan - but not when typing in input/textarea"),
        ("// Global mouse up để đảm bảo drag kết thúc", "// Global mouse up to ensure drag ends"),
        ("// Calculate orthogonal path for connections - đường vuông góc như ô bàn cờ", "// Calculate orthogonal path for connections - right-angle grid-like path"),
        ("// Luôn tạo đường vuông góc (orthogonal)", "// Always create orthogonal paths"),
        ("// Nếu nodes thẳng hàng theo chiều dọc (dx rất nhỏ), tạo đường thẳng đứng", "// If nodes are vertically aligned (dx is very small), create vertical line"),
        ("// Nếu nodes thẳng hàng theo chiều ngang (dy rất nhỏ), tạo đường thẳng ngang", "// If nodes are horizontally aligned (dy is very small), create horizontal line"),
        ("// Tạo đường vuông góc: đi thẳng đứng trước, rồi đi ngang, rồi đi thẳng đứng", "// Create orthogonal path: vertical first, then horizontal, then vertical"),
        ("// Điểm giữa theo chiều dọc", "// Midpoint on vertical axis"),
        ("/* Transform container - không giới hạn không gian */", "/* Transform container - unlimited canvas space */"),
        ("// Chiều ngang node nhân 1.5 lần (208 * 1.5 = 312)", "// Node width multiplied by 1.5 (208 * 1.5 = 312)"),
        ("// Chỉ handle click nếu không phải drag (mouse không di chuyển)", "// Only handle click when not dragging (mouse did not move)"),
        ("/* Input Connection Point - Top center for vertical layout, sát node */", "/* Input Connection Point - Top center for vertical layout, close to node */"),
        ("/* Output Connection Point - Bottom center for vertical layout, sát node */", "/* Output Connection Point - Bottom center for vertical layout, close to node */"),
        ("// Tính toán cho vertical layout", "// Calculations for vertical layout"),
        ("// Node: width = 312px (208 * 1.5), height = ~120px (với padding)", "// Node: width = 312px (208 * 1.5), height = ~120px (with padding)"),
        ("// Connection points: w-5 h-5 = 20px, positioned ở top/bottom center, sát node", "// Connection points: w-5 h-5 = 20px, positioned at top/bottom center, close to node"),
        ("// Top (input): centerX = node.x + NODE_WIDTH/2, centerY = node.y (sát node)", "// Top (input): centerX = node.x + NODE_WIDTH/2, centerY = node.y (close to node)"),
        ("// Bottom (output): centerX = node.x + NODE_WIDTH/2, centerY = node.y + NODE_HEIGHT (sát node)", "// Bottom (output): centerX = node.x + NODE_WIDTH/2, centerY = node.y + NODE_HEIGHT (close to node)"),
        ("// Center X của nodes (vertical layout - nodes centered)", "// Center X of nodes (vertical layout - nodes centered)"),
        ("// Connection points - top/bottom center, sát node hơn nữa (dính liền hoàn toàn)", "// Connection points - top/bottom center, even closer to node (fully attached)"),
        ("// Sát node hoàn toàn", "// Fully attached to node"),
        ("// Path: từ output (bottom) của source node đến input (top) của target node", "// Path: from source node output (bottom) to target node input (top)"),
        ("// Sử dụng bezier curve", "// Use bezier curve"),
        ("// Xác định màu và label dựa trên connection.label", "// Determine color and label based on connection.label"),
        ("// Tính toán vị trí giữa đường kẻ để đặt label Yes/No", "// Calculate midpoint position to place Yes/No label"),
        ("// Label cần ở giữa đường kẻ (điểm giữa của toàn bộ path)", "// Label should be centered on the line (midpoint of full path)"),
        ("// Đường thẳng đứng - label ở giữa", "// Vertical line - label in the middle"),
        ("// Đường gấp khúc - label ở giữa đoạn ngang (điểm giữa của path)", "// Bent line - label at middle of horizontal segment (path midpoint)"),
        ("// Điểm giữa theo chiều dọc (nơi đoạn ngang)", "// Midpoint on vertical axis (where horizontal segment sits)"),
        ("// Điểm giữa đoạn ngang", "// Midpoint of horizontal segment"),
        ("// Tất cả đường nối là nét đứt", "// All connectors are dashed"),
        ("/* Plus button on connection - positioned at midpoint, tách xa label */", "/* Plus button on connection - positioned at midpoint, separated from label */"),
        ("// Tính toán tương tự như connection thật - vertical layout", "// Similar calculations as actual connection - vertical layout"),
        ("// Center của output connection point (bottom center), sát node", "// Center of output connection point (bottom center), close to node"),
    ],
    "backend/app/routers/atlas.py": [
        (
            "# --- Calendar events cache (meetings loaded from calendar API; trùng id thì update) ---",
            "# --- Calendar events cache (meetings loaded from calendar API; update on duplicate id) ---",
        ),
        (
            "\"\"\"Save calendar events when loading; trùng event_id thì update, không tạo bản ghi mới.\"\"\"",
            "\"\"\"Save calendar events on load; update on duplicate event_id, do not create a new record.\"\"\"",
        ),
        (
            "# Map event_id -> saved calendar event data (từ calendar_events_cache)",
            "# Map event_id -> saved calendar event data (from calendar_events_cache)",
        ),
    ],
    "backend/app/routers/meetings.py": [
        ("# 0-100, từ interest_score trong DB", "# 0-100, from interest_score in DB"),
        ("# Lấy interest_score từ doc hoặc từ atlas_evaluation", "# Get interest_score from doc or from atlas_evaluation"),
    ],
    "backend/app/services/telegram_service.py": [
        (
            ":param recipient: username (str) hoặc user_id (int) hoặc chat_id",
            ":param recipient: username (str), user_id (int), or chat_id",
        ),
        (":param message: nội dung tin nhắn", ":param message: message content"),
        (
            ":param user_id: User ID để lấy Telegram client từ session",
            ":param user_id: User ID used to get Telegram client from session",
        ),
        (":return: True nếu gửi thành công, False nếu thất bại", ":return: True if sent successfully, False otherwise"),
        (
            "# Đảm bảo user_id là string (telegram_listener sử dụng string keys)",
            "# Ensure user_id is a string (telegram_listener uses string keys)",
        ),
        ("# Lấy client từ telegram_listener", "# Get client from telegram_listener"),
        ("# Kiểm tra xem client có đang kết nối không", "# Check whether client is connected"),
        (
            "# Kiểm tra recipient có @ chưa, nếu chưa thì thêm vào",
            "# Check whether recipient already has @; add it if missing",
        ),
        ("# Gửi tin nhắn", "# Send message"),
    ],
    "backend/app/services/scheduler.py": [
        ("# Kiểm tra và thêm @ nếu chưa có", "# Check and add @ if missing"),
        ("# Sử dụng hàm send_message_to_user thay vì API call", "# Use send_message_to_user function instead of API call"),
    ],
    "backend/app/services/workflow_executor.py": [
        ("# Kiểm tra và thêm @ nếu chưa có", "# Check and add @ if missing"),
        ("# Sử dụng hàm send_message_to_user thay vì API call", "# Use send_message_to_user function instead of API call"),
    ],
    "backend/app/routers/campaigns.py": [
        ("# Kiểm tra và thêm @ nếu chưa có", "# Check and add @ if missing"),
        ("# Sử dụng hàm send_message_to_user thay vì API call", "# Use send_message_to_user function instead of API call"),
    ],
}


def apply_replacements() -> None:
    total_files_changed = 0
    total_replacements = 0

    for file_path, pairs in REPLACEMENTS.items():
        path = Path(file_path)

        if not path.exists():
            print(f"[SKIP] File not found: {file_path}")
            continue

        original_content = path.read_text(encoding="utf-8")
        updated_content = original_content
        replacements_in_file = 0

        for old_text, new_text in pairs:
            occurrences = updated_content.count(old_text)
            if occurrences > 0:
                updated_content = updated_content.replace(old_text, new_text)
                replacements_in_file += occurrences

        if updated_content != original_content:
            path.write_text(updated_content, encoding="utf-8")
            total_files_changed += 1
            total_replacements += replacements_in_file
            print(f"[UPDATED] {file_path}: {replacements_in_file} replacement(s)")
        else:
            print(f"[UNCHANGED] {file_path}")

    print("\n=== Summary ===")
    print(f"Files changed: {total_files_changed}")
    print(f"Total replacements: {total_replacements}")


if __name__ == "__main__":
    apply_replacements()