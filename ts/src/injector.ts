import { EditableAttributes, EditorAttributes } from "./types";
import { setAttributes, injectStylesheet } from "./utils";

const StyleInjector: Record<string, any> = {
    update: async function (
        addonPackage: string,
        attrs: EditorAttributes,
    ): Promise<void> {
        setAttributes(document.documentElement, { ...attrs });

        if (attrs.pointVersion < 50) {
            [...document.getElementById("fields")!.children].forEach(
                (field: any, i) => {
                    const editable = field.editingArea.editable;
                    inject(addonPackage, editable, { ord: i + 1, ...attrs });
                },
            );
        } else {
            /* Thanks to Hikaru Y. for generously providing this async iterator! */
            const { default: iterateAnkiEditables } = await import("./iterator");
            for await (const [editable, i] of iterateAnkiEditables()) {
                inject(addonPackage, editable, { ord: i + 1, ...attrs });
            }
        }
    },
};

function inject(
    addonPackage: string,
    editable: HTMLElement,
    attrs: EditableAttributes,
) {
    const root = editable.getRootNode() as ShadowRoot;

    editable.classList.add(...document.body.classList);

    let fieldName: string | null | undefined;
    if (attrs.pointVersion < 50) {
        fieldName = root.host.previousElementSibling?.getAttribute("title");
    } else if (attrs.pointVersion < 55) {
        fieldName = root.host.closest(".editor-field")?.querySelector(".label-name")?.innerHTML;
    } else { // >= 55
        fieldName = root.host.closest(".field-container")?.querySelector(".label-name")?.innerHTML;
    }
    fieldName = fieldName || "";

    setAttributes(editable, {
        field: fieldName,
        ...attrs,
    });

    if (!root.querySelector("link[title*='CSS Injector']")) {
        injectStylesheet(root, editable, `/_addons/${addonPackage}/user_files/field.css`);
    }
}

globalThis.StyleInjector = StyleInjector;
