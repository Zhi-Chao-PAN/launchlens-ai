import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ValidationBoardFooter } from "./validation-board-footer";

describe("<ValidationBoardFooter>", () => {
  it("renders validation-board keyboard tips", () => {
    const html = renderToStaticMarkup(<ValidationBoardFooter />);
    expect(html).toContain("Tip: press");
    expect(html).toContain("Shift");
    expect(html).toContain("-tag");
    expect(html).toContain("Ctrl/Cmd");
    expect(html).toContain("Shift+?");
  });

  it("uses balanced keycap markup for the command palette shortcut", () => {
    const html = renderToStaticMarkup(<ValidationBoardFooter />);
    expect(html).toContain("<kbd");
    expect(html).toContain("</kbd>+<kbd");
    expect(html).not.toContain(String.fromCharCode(0x9231));
    expect(html).not.toContain(String.fromCharCode(0x8def));
  });
});
