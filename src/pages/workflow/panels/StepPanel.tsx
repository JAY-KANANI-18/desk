import React from 'react';
import { StepConfig } from '../workflow.types';
import { STEP_META } from '../canvas/stepTypes';
import { PanelShell } from './PanelShell';
import { useWorkflow } from '../WorkflowContext';
import { SendMessageConfig, AskQuestionConfig, AssignToConfig, BranchConfig, UpdateContactTagConfig, UpdateContactFieldConfig, OpenConversationConfig, CloseConversationConfig, AddCommentConfig, JumpToConfig, WaitConfig, TriggerAnotherWorkflowConfig, DateTimeConfig, HttpRequestConfig,
  //  GoogleSheetsConfig, ConversionsApiConfig, TikTokEventConfig 
  } from './steps';

interface StepPanelProps {
  step: StepConfig;
  hideHeader?: boolean;
}

export function StepPanel({ step, hideHeader = false }: StepPanelProps) {
  const { updateStep, selectNode } = useWorkflow();
  const meta = STEP_META[step.type];

  const handleUpdate = (data: StepConfig['data']) => {
    updateStep({ ...step, data });
  };

  const renderConfig = () => {
    switch (step.type) {
      case 'send_message':
        return <SendMessageConfig step={step} onChange={handleUpdate} />;
      case 'ask_question':
        return <AskQuestionConfig step={step} onChange={handleUpdate} />;
      case 'assign_to':
        return <AssignToConfig step={step} onChange={handleUpdate} />;
      case 'branch':
        return <BranchConfig step={step} onChange={handleUpdate} />;
      case 'update_contact_tag':
        return <UpdateContactTagConfig step={step} onChange={handleUpdate} />;
      case 'update_contact_field':
        return <UpdateContactFieldConfig step={step} onChange={handleUpdate} />;
      case 'open_conversation':
        return <OpenConversationConfig step={step} onChange={handleUpdate} />;
      case 'close_conversation':
        return <CloseConversationConfig step={step} onChange={handleUpdate} />;
      case 'add_comment':
        return <AddCommentConfig step={step} onChange={handleUpdate} />;
      case 'jump_to':
        return <JumpToConfig step={step} onChange={handleUpdate} />;
      case 'wait':
        return <WaitConfig step={step} onChange={handleUpdate} />;
      case 'trigger_another_workflow':
        return <TriggerAnotherWorkflowConfig step={step} onChange={handleUpdate} />;
      case 'date_time':
        return <DateTimeConfig step={step} onChange={handleUpdate} />;
      case 'http_request':
        return <HttpRequestConfig step={step} onChange={handleUpdate} />;
      // case 'add_google_sheets_row':
      //   return <GoogleSheetsConfig step={step} onChange={handleUpdate} />;
      // case 'send_conversions_api_event':
      //   return <ConversionsApiConfig step={step} onChange={handleUpdate} />;
      // case 'send_tiktok_lower_funnel_event':
      //   return <TikTokEventConfig step={step} onChange={handleUpdate} />;
      default:
        return (
          <div className="p-4 text-sm text-gray-500">
            Configuration not available for this step type.
          </div>
        );
    }
  };

  return (
    <PanelShell
      title={meta.label}
      subtitle={meta.description}
      onClose={() => selectNode(null, null)}
      hideHeader={hideHeader}
    >
      {renderConfig()}
    </PanelShell>
  );
}
