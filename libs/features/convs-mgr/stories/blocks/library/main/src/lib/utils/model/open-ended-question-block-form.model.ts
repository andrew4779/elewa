import { FormBuilder, FormGroup, Validators } from "@angular/forms";

import { StoryBlockTypes } from "@app/model/convs-mgr/stories/blocks/main";
import {  OpenEndedQuestionBlock } from "@app/model/convs-mgr/stories/blocks/messaging";

/**
 * 
 * @param _fb instance of formbuilder that creates formgroups controls etc
 * @param blockData the data being patched into the FormGroup
 * @returns builds the formgroup with data if available and returns the Formgroup
 */
export function _CreateOpenEndedQuestionBlockForm(_fb: FormBuilder, blockData: OpenEndedQuestionBlock): FormGroup {
  return _fb.group({
    id: [blockData?.id! ?? ''],
    message: [blockData?.message! ?? ''],
    defaultTarget: [blockData.defaultTarget ?? ''],
    type: [blockData.type ?? StoryBlockTypes.OpenEndedQuestion],
    position: [blockData.position ?? { x: 200, y: 50 }],

    variable: _fb.group({
      name: [blockData.variable?.name ?? '', [Validators.required]],
      type: [blockData.variable?.type ?? 1, [Validators.required]],
      validate: [blockData.variable?.validate ?? false, [Validators.required]],

      validators: _fb.group({
        regex: [blockData.variable?.validators?.regex ?? ''],
        max: [blockData.variable?.validators?.max ?? ''],
        min: [blockData.variable?.validators?.min ?? ''],
        validationMessage: [
          blockData.variable?.validators?.validationMessage ??
            "I'm afraid I didn't understand, could you try again, please?",
        ],
      })
    })
  })
}