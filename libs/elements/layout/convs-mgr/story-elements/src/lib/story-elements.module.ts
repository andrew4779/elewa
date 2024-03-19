import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';

import { FlexLayoutModule, MaterialDesignModule } from '@iote/bricks-angular';
import { MultiLangModule } from '@ngfi/multi-lang';

import { CreateBotModalComponent } from './modals/create-bot-modal/create-bot-modal.component';

import { BotCreateFlowModalComponent } from './modals/bot-create-flow-modal/bot-create-flow-modal.component';
import { CreateModuleModalComponent } from './modals/create-module-modal/create-module-modal.component';
import { CreateLessonModalComponent } from './modals/create-lesson-modal/create-lesson-modal.component';
import { ConfirmDeleteModalComponent } from './modals/confirm-delete-modal/confirm-delete-modal.component';

@NgModule({
  imports: [
    CommonModule,
    MultiLangModule,
    FlexLayoutModule,
    MaterialDesignModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
  ],
  declarations: [
    CreateBotModalComponent,
    CreateModuleModalComponent,
    CreateLessonModalComponent,
    BotCreateFlowModalComponent,
    ConfirmDeleteModalComponent,
  ],
})
export class ConvsMgrStoryElementsModule {}
