import { WorkflowTemplate } from './workflow.types';

export const TEMPLATES: WorkflowTemplate[] = [
  // ── Welcome & Onboarding ───────────────────
  {
    id: 'welcome-message',
    name: 'Welcome Message',
    description: 'Send an automated welcome message every time a contact starts a conversation.',
    category: 'welcome',
    tags: ['messaging', 'inbound'],
    popular: true,
    iconName: 'MessageCircle',
    color: 'bg-blue-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "type": "conversation_opened",
          "conditions": [
            {
              "id": "ws3yzx",
              "field": "source",
              "operator": "is_equal_to",
              "value": "contact"
            }
          ],
          "advancedSettings": {
            "triggerOncePerContact": false
          },
          "data": {
            "sources": []
          }
        },
        "steps": [
          {
            "id": "step-1774675972238",
            "type": "send_message",
            "name": "send_message 1",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "type": "text",
                "text": "hello {{$contact.first_name}} ,\nwelcome to chat."
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  {
    id: 'welcome-ask-email',
    name: 'Welcome & Ask For Email',
    description: 'Welcome the contact and collect their email if not already stored.',
    category: 'welcome',
    tags: ['messaging', 'data-collection'],
    iconName: 'Mail',
    color: 'bg-indigo-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "type": "conversation_opened",
          "conditions": [
            {
              "id": "ws3yzx",
              "field": "source",
              "operator": "is_equal_to",
              "value": "contact"
            }
          ],
          "advancedSettings": {
            "triggerOncePerContact": false
          },
          "data": {
            "sources": []
          }
        },
        "steps": [
          {
            "id": "step-1774681721536",
            "data": {
              "connectors": [
                "conn-1774681721536-1",
                "conn-1774681721536-2"
              ]
            },
            "name": "branch 1",
            "type": "branch",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774681721536-1",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774681722873",
                  "field": "email",
                  "value": "",
                  "category": "contact_field",
                  "operator": "does_not_exist"
                }
              ],
              "connectors": [
                "conn-1774681721537-1",
                "conn-1774681721537-2"
              ]
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774681721536",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774681721536-2",
            "data": {
              "connectors": [
                "conn-1774681721537-1",
                "conn-1774681721537-2"
              ]
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774681721536",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774682175420",
            "data": {
              "saveAsTag": false,
              "timeoutUnit": "days",
              "questionText": "What is your email?",
              "questionType": "email",
              "timeoutValue": 7,
              "contactFieldId": "email",
              "saveAsVariable": false,
              "addTimeoutBranch": false,
              "saveAsContactField": true,
              "multipleChoiceOptions": [],
              "addMessageFailureBranch": false
            },
            "name": "ask_question 2",
            "type": "ask_question",
            "parentId": "conn-1774681721536-1",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ],

      },
    }
  },
  {
    id: 'welcome-ask-phone',
    name: 'Welcome & Ask For Phone Number',
    description: 'Welcome the contact and collect their phone number if not already stored.',
    category: 'welcome',
    tags: ['messaging', 'data-collection'],
    iconName: 'Phone',
    color: 'bg-cyan-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "type": "conversation_opened",
          "conditions": [
            {
              "id": "ws3yzx",
              "field": "source",
              "operator": "is_equal_to",
              "value": "contact"
            }
          ],
          "advancedSettings": {
            "triggerOncePerContact": false
          },
          "data": {
            "sources": []
          }
        },
        "steps": [
          {
            "id": "step-1774681721536",
            "data": {
              "connectors": [
                "conn-1774681721536-1",
                "conn-1774681721536-2"
              ]
            },
            "name": "branch 1",
            "type": "branch",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774681721536-1",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774681722873",
                  "field": "email",
                  "value": "",
                  "category": "contact_field",
                  "operator": "does_not_exist"
                }
              ],
              "connectors": [
                "conn-1774681721537-1",
                "conn-1774681721537-2"
              ]
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774681721536",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774681721536-2",
            "data": {
              "connectors": [
                "conn-1774681721537-1",
                "conn-1774681721537-2"
              ]
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774681721536",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774682175420",
            "data": {
              "saveAsTag": false,
              "timeoutUnit": "days",
              "questionText": "What is your Phone?",
              "questionType": "phone",
              "timeoutValue": 7,
              "contactFieldId": "phone",
              "saveAsVariable": false,
              "addTimeoutBranch": false,
              "saveAsContactField": true,
              "multipleChoiceOptions": [],
              "addMessageFailureBranch": false
            },
            "name": "ask_question 2",
            "type": "ask_question",
            "parentId": "conn-1774681721536-1",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ],
      }
    },
  },

  {
    id: 'away-business-hours',
    name: 'Away Message with Business Hours',
    description: 'Send an away message only outside your business hours.',
    category: 'welcome',
    tags: ['messaging', 'business-hours'],
    iconName: 'Clock',
    color: 'bg-sky-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "type": "conversation_opened",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          },
          "data": {
            "sources": []
          }
        },
        "steps": [
          {
            "id": "step-1774685477064",
            "type": "date_time",
            "name": "date_time 1",
            "data": {
              "timezone": "UTC",
              "mode": "business_hours",
              "businessHours": {
                "monday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "tuesday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "thursday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "wednesday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "friday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "saturday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                },
                "sunday": {
                  "enabled": true,
                  "startTime": "09:00",
                  "endTime": "17:00"
                }
              },
              "connectors": [
                "conn-inrange-1774685477064",
                "conn-outofrange-1774685477064"
              ]
            },
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-inrange-1774685477064",
            "type": "branch_connector",
            "name": "In Range",
            "parentId": "step-1774685477064",
            "data": {
              "conditions": []
            },
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-outofrange-1774685477064",
            "type": "branch_connector",
            "name": "Out of Range",
            "parentId": "step-1774685477064",
            "data": {
              "conditions": []
            },
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774685534347",
            "type": "send_message",
            "name": "send_message 2",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "type": "text",
                "text": "Hello {{$contact.firstname}} welcome to the chat!"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "parentId": "conn-inrange-1774685477064",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774685566487",
            "type": "send_message",
            "name": "send_message 3",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "type": "text",
                "text": "Sorry, we are currently away. We will respond as soon as possible."
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "parentId": "conn-outofrange-1774685477064",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      },
    },
  },
  {
    id: 'multi-level-chat-menu',
    name: 'Multi level chat menu',
    description: 'Send a multi-level menu to let contacts self-serve and route themselves to the right team.',
    category: 'welcome',
    tags: ['routing', 'choice', 'menu'],
    iconName: 'Clock',
    color: 'bg-sky-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "data": {},
          "type": "manual_trigger",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          }
        },
        "steps": [
          {
            "id": "step-1774935084629",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "We offer a variety of products.",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 1",
            "type": "send_message",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774935119946",
            "data": {
              "saveAsTag": false,
              "connectors": [
                "conn-success-1774935119946",
                "conn-failure-1774935119946"
              ],
              "timeoutUnit": "days",
              "questionText": "Select a product to learn more about them or go back to Main Menu.",
              "questionType": "multiple_choice",
              "timeoutValue": 7,
              "variableName": "all_product",
              "saveAsVariable": true,
              "addTimeoutBranch": false,
              "saveAsContactField": false,
              "multipleChoiceOptions": [
                {
                  "id": "id-1774935123586-hanh",
                  "label": "Product 1"
                },
                {
                  "id": "id-1774935168205-6k28",
                  "label": "Product 2"
                },
                {
                  "id": "id-1774935169470-h844",
                  "label": "Product 3"
                },
                {
                  "id": "id-1774935176730-qswk",
                  "label": "Back to main menu"
                }
              ],
              "addMessageFailureBranch": false
            },
            "name": "ask_question 2",
            "type": "ask_question",
            "parentId": "step-1774935084629",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-success-1774935119946",
            "data": {
              "conditions": []
            },
            "name": "Success",
            "type": "branch_connector",
            "parentId": "step-1774935119946",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-failure-1774935119946",
            "data": {
              "conditions": []
            },
            "name": "Failure",
            "type": "branch_connector",
            "parentId": "step-1774935119946",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774935227002",
            "data": {
              "connectors": [
                "conn-1774935227002-1",
                "conn-1774935227002-2",
                "conn-1774936531275-gj1",
                "conn-1774936591991-z69",
                "conn-1774936621190-92i"
              ]
            },
            "name": "branch 3",
            "type": "branch",
            "parentId": "conn-success-1774935119946",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774935227002-1",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774935276736",
                  "field": "all_product",
                  "value": "Product 1",
                  "category": "variable",
                  "operator": "is_equal_to"
                }
              ]
            },
            "name": "Product 1",
            "type": "branch_connector",
            "parentId": "step-1774935227002",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774935227002-2",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774936504909",
                  "field": "all_product",
                  "value": "Product 2",
                  "category": "variable",
                  "operator": "is_equal_to"
                }
              ]
            },
            "name": "Product 2",
            "type": "branch_connector",
            "parentId": "step-1774935227002",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774936531275-gj1",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774936560559",
                  "field": "all_product",
                  "value": "Product 3",
                  "category": "variable",
                  "operator": "is_equal_to"
                }
              ]
            },
            "name": "Product 3",
            "type": "branch_connector",
            "parentId": "step-1774935227002",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774936621190-92i",
            "data": {
              "conditions": [
                {
                  "id": "cond-1774938757202",
                  "field": "all_product",
                  "value": "Back to Main Menu",
                  "category": "variable",
                  "operator": "is_equal_to"
                }
              ]
            },
            "name": "Back to main  menu",
            "type": "branch_connector",
            "parentId": "step-1774935227002",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774936709667-1",
            "data": {
              "conditions": []
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774936709666",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "conn-1774936709667-2",
            "data": {
              "conditions": []
            },
            "name": "Branch Path",
            "type": "branch_connector",
            "parentId": "step-1774936709666",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774936718669",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "Product 1 Information",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 2",
            "type": "send_message",
            "parentId": "conn-1774935227002-1",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774936738786",
            "data": {
              "channel": "last_interacted",
              "attachments": [
                {
                  "url": "https://pub-24dced1e31f84630bdd9238d9adf3157.r2.dev/files/attachments/messages/step-1774936738786/1774938502703-12X18-V9-D 46X31 cm.jpg",
                  "type": "image",
                  "filename": "12X18-V9-D 46X31 cm.jpg",
                  "mimeType": "image/jpeg"
                }
              ],
              "defaultMessage": {
                "text": "",
                "type": "media"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 3",
            "type": "send_message",
            "parentId": "step-1774936718669",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938603862",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "Product 2 Detail",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 1",
            "type": "send_message",
            "parentId": "conn-1774935227002-2",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938617704",
            "data": {
              "channel": "last_interacted",
              "attachments": [
                {
                  "url": "https://pub-24dced1e31f84630bdd9238d9adf3157.r2.dev/files/attachments/messages/step-1774938617704/1774938620747-960x540.jpg",
                  "size": 47047,
                  "type": "image",
                  "filename": "960x540.jpg",
                  "mimeType": "image/jpeg"
                }
              ],
              "defaultMessage": {
                "text": "",
                "type": "media"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 2",
            "type": "send_message",
            "parentId": "step-1774938603862",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938624352",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "Product 3 details",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 3",
            "type": "send_message",
            "parentId": "conn-1774936531275-gj1",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938642169",
            "data": {
              "channel": "last_interacted",
              "attachments": [
                {
                  "url": "https://pub-24dced1e31f84630bdd9238d9adf3157.r2.dev/files/attachments/messages/step-1774938642169/1774938648800-images (1).jpeg",
                  "size": 10694,
                  "type": "image",
                  "filename": "images (1).jpeg",
                  "mimeType": "image/jpeg"
                }
              ],
              "defaultMessage": {
                "text": "",
                "type": "media"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 4",
            "type": "send_message",
            "parentId": "step-1774938624352",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938678134",
            "data": {
              "maxJumps": 3,
              "targetStepId": "step-1774935119946"
            },
            "name": "jump_to 5",
            "type": "jump_to",
            "parentId": "step-1774936738786",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938691692",
            "data": {
              "maxJumps": 3,
              "targetStepId": "step-1774935119946"
            },
            "name": "jump_to 6",
            "type": "jump_to",
            "parentId": "step-1774938617704",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774938702505",
            "data": {
              "maxJumps": 3,
              "targetStepId": "step-1774935119946"
            },
            "name": "jump_to 7",
            "type": "jump_to",
            "parentId": "step-1774938642169",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939146961",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "Ready to go back to the main menu? Just send me a message to confirm!",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 8",
            "type": "send_message",
            "parentId": "conn-1774936621190-92i",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939176292",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": "Sorry, I did not get that.",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 9",
            "type": "send_message",
            "parentId": "conn-failure-1774935119946",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939192140",
            "data": {
              "maxJumps": 3,
              "targetStepId": "step-1774935119946"
            },
            "name": "jump_to 10",
            "type": "jump_to",
            "parentId": "step-1774939176292",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939212370",
            "data": {
              "channel": "last_interacted",
              "defaultMessage": {
                "text": " Not finding what you need here? Let's go back to the Main Menu for more options. Just send me a message to confirm! ",
                "type": "text"
              },
              "channelResponses": [],
              "addMessageFailureBranch": false
            },
            "name": "send_message 11",
            "type": "send_message",
            "parentId": "step-1774939192140",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939225952",
            "data": {
              "addClosingNotes": false
            },
            "name": "close_conversation 12",
            "type": "close_conversation",
            "parentId": "step-1774939212370",
            "position": {
              "x": 0,
              "y": 0
            }
          },
          {
            "id": "step-1774939232561",
            "data": {
              "addClosingNotes": false
            },
            "name": "close_conversation 13",
            "type": "close_conversation",
            "parentId": "step-1774939146961",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  // {
  //   id: 'privacy-consent',
  //   name: 'Request Privacy Consent',
  //   description: "Get the contact's privacy consent before continuing the conversation.",
  //   category: 'welcome',
  //   tags: ['compliance', 'messaging'],
  //   iconName: 'ShieldCheck',
  //   color: 'bg-teal-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },

  // ── Lead Generation ─────────────────────────
  // {
  //   id: 'lead-qualification',
  //   name: 'Lead Qualification',
  //   description: 'Automatically qualify leads based on their responses and route them accordingly.',
  //   category: 'leads',
  //   tags: ['qualification', 'routing'],
  //   popular: true,
  //   iconName: 'UserPlus',
  //   color: 'bg-green-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'lead-nurture',
  //   name: 'Lead Nurture Campaign',
  //   description: 'Nurture cold leads with a series of targeted messages over time.',
  //   category: 'leads',
  //   tags: ['nurture', 'drip'],
  //   iconName: 'Sparkles',
  //   color: 'bg-emerald-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'webform-followup',
  //   name: 'Web Form Follow-up',
  //   description: 'Instantly follow up when a contact submits a form on your website.',
  //   category: 'leads',
  //   tags: ['webhook', 'followup'],
  //   iconName: 'FileText',
  //   color: 'bg-lime-600',
  //   defaultWorkflow: {
  //     trigger: {
  //       type: 'incoming_webhook',
  //       conditions: [],
  //       advancedSettings: { triggerOncePerContact: false },
  //       data: {
  //         webhookUrl: 'https://app.respond.io/webhook/placeholder',
  //         contactIdentifierType: 'email',
  //         contactIdentifierJsonKey: '$.email',
  //         variables: [],
  //       },
  //     },
  //     steps: [],
  //   },
  // },

  // ── Customer Support ──────────────────────
  // {
  //   id: 'auto-reply-routing',
  //   name: 'Auto Reply & Routing',
  //   description: 'Auto-reply to incoming messages and route them to the right team.',
  //   category: 'support',
  //   tags: ['routing', 'messaging', 'assignment'],
  //   popular: true,
  //   iconName: 'Headphones',
  //   color: 'bg-purple-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'csat-survey',
  //   name: 'CSAT Survey',
  //   description: 'Send a satisfaction survey after a conversation is closed.',
  //   category: 'support',
  //   tags: ['survey', 'csat'],
  //   iconName: 'Star',
  //   color: 'bg-yellow-500',
  //   defaultWorkflow: {
  //     trigger: {
  //       type: 'conversation_closed',
  //       conditions: [],
  //       advancedSettings: { triggerOncePerContact: false },
  //       data: { sources: [], categories: [] },
  //     },
  //     steps: [],
  //   },
  // },
  // {
  //   id: 'csat-google-sheets',
  //   name: 'CSAT to Google Sheets',
  //   description: 'Collect CSAT after conversation close and log data to Google Sheets.',
  //   category: 'support',
  //   tags: ['survey', 'sheets', 'csat'],
  //   iconName: 'Sheet',
  //   color: 'bg-green-600',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'issue-escalation',
  //   name: 'Issue Escalation',
  //   description: 'Shortcut button for agents to escalate issues to 2nd-level support teams.',
  //   category: 'support',
  //   tags: ['escalation', 'shortcut'],
  //   iconName: 'AlertTriangle',
  //   color: 'bg-red-500',
  //   defaultWorkflow: {

  //     config: {
  //       trigger: {
  //         type: 'shortcut',
  //         conditions: [],
  //         advancedSettings: { triggerOncePerContact: false },
  //         data: { icon: '⚡', name: 'Issue Escalation', description: 'Escalate to 2nd level support', formFields: [] },
  //       },

  //       steps: [],
  //       settings: { allowStopForContact: true, exitOnOutgoingMessage: true, exitOnIncomingMessage: false, exitOnManualAssignment: false },
  //     }


  //   },
  // },


  // ── Sales & Marketing ──────────────────────
  // {
  //   id: 'abandoned-cart',
  //   name: 'Abandoned Cart Recovery',
  //   description: 'Recover lost sales by messaging customers who abandoned their cart.',
  //   category: 'sales',
  //   tags: ['ecommerce', 'recovery'],
  //   popular: true,
  //   iconName: 'ShoppingCart',
  //   color: 'bg-orange-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'promo-broadcast',
  //   name: 'Promotional Broadcast',
  //   description: 'Send targeted promotions to segmented contact lists.',
  //   category: 'sales',
  //   tags: ['broadcast', 'promotions'],
  //   iconName: 'Megaphone',
  //   color: 'bg-pink-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'upsell-crosssell',
  //   name: 'Upsell & Cross-sell',
  //   description: 'Recommend related products after a purchase is completed.',
  //   category: 'sales',
  //   tags: ['upsell', 'ecommerce'],
  //   iconName: 'Gift',
  //   color: 'bg-rose-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'sales-call-report',
  //   name: 'Sales Call Report',
  //   description: 'Shortcut for sales agents to log a report on their call with contacts.',
  //   category: 'sales',
  //   tags: ['shortcut', 'reporting'],
  //   iconName: 'Phone',
  //   color: 'bg-blue-600',
  //   defaultWorkflow: {
  //     trigger: {
  //       type: 'shortcut',
  //       conditions: [],
  //       advancedSettings: { triggerOncePerContact: false },
  //       data: { icon: '📞', name: 'Sales Call Report', description: 'Log a sales call', formFields: [] },
  //     },
  //     steps: [],
  //   },
  // },

  // ── Routing ───────────────────────────────
  // {
  //   id: 'routing-new-returning',
  //   name: 'Route: New & Returning Contacts',
  //   description: 'Identify new and returning contacts and route them differently.',
  //   category: 'routing',
  //   tags: ['routing', 'segmentation'],
  //   iconName: 'GitFork',
  //   color: 'bg-indigo-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'routing-vip',
  //   name: 'Route VIP Contacts',
  //   description: 'Fetch contact data to identify VIPs and route them for specialized service.',
  //   category: 'routing',
  //   tags: ['routing', 'vip', 'http'],
  //   iconName: 'Crown',
  //   color: 'bg-amber-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  {
    id: 'routing-least-busy',
    name: 'Assign to least busy user',
    description: 'Automatically assign contacts to the least open contact in a workspace.',
    category: 'routing',
    tags: ['routing', 'assignment'],
    iconName: 'Users',
    color: 'bg-teal-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "data": {
            "sources": []
          },
          "type": "conversation_opened",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          }
        },
        "steps": [
          {
            "id": "step-1774685850646",
            "data": {
              "action": "user_in_team",
              "timeoutUnit": "days",
              "timeoutValue": 7,
              "assignmentLogic": "least_open_contacts",
              "onlyOnlineUsers": false,
              "addTimeoutBranch": false
            },
            "name": "assign_to 1",
            "type": "assign_to",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  {
    id: 'routing-round-robin',
    name: 'Assign Round Robin',
    description: 'Automatically assign contacts to users in a round-robin manner to distribute workload evenly.',
    category: 'routing',
    tags: ['routing', 'assignment'],
    iconName: 'Users',
    color: 'bg-teal-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "type": "conversation_opened",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          },
          "data": {
            "sources": []
          }
        },
        "steps": [
          {
            "id": "step-1774685850646",
            "type": "assign_to",
            "name": "assign_to 1",
            "data": {
              "action": "user_in_team",
              "assignmentLogic": "round_robin",
              "onlyOnlineUsers": false,
              "addTimeoutBranch": false,
              "timeoutValue": 7,
              "timeoutUnit": "days"
            },
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  {
    id: 'routing-round-robin-online',
    name: 'Assign Round Robin (Online Only)',
    description: 'Automatically assign contacts to online users in a round-robin manner to ensure faster response times.',
    category: 'routing',
    tags: ['routing', 'assignment', 'online-only'],
    iconName: 'Users',
    color: 'bg-teal-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "data": {
            "sources": []
          },
          "type": "conversation_opened",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          }
        },
        "steps": [
          {
            "id": "step-1774685850646",
            "data": {
              "action": "user_in_team",
              "timeoutUnit": "days",
              "timeoutValue": 7,
              "assignmentLogic": "round_robin",
              "onlyOnlineUsers": true,
              "addTimeoutBranch": false
            },
            "name": "assign_to 1",
            "type": "assign_to",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  {
    id: 'routing-unassign-after-closed',
    name: 'Unassign after conversation closed',
    description: 'Automatically unassign contacts after their conversation is closed.',
    category: 'routing',
    tags: ['routing', 'assignment', 'conversation-closed'],
    iconName: 'Users',
    color: 'bg-teal-500',
    defaultWorkflow: {
      config: {
        "trigger": {
          "data": {
            "sources": []
          },
          "type": "conversation_opened",
          "conditions": [],
          "advancedSettings": {
            "triggerOncePerContact": false
          }
        },
        "steps": [
          {
            "id": "step-1774685850646",
            "data": {
              "action": "unassign",
              "timeoutUnit": "days",
              "timeoutValue": 7,
              "assignmentLogic": "round_robin",
              "onlyOnlineUsers": false,
              "addTimeoutBranch": false
            },
            "name": "assign_to 1",
            "type": "assign_to",
            "parentId": "trigger",
            "position": {
              "x": 0,
              "y": 0
            }
          }
        ]
      }
    },
  },
  // {
  //   id: 'routing-shifts',
  //   name: 'Route by Shifts',
  //   description: 'Route contacts to the right team based on current business hours/shifts.',
  //   category: 'routing',
  //   tags: ['routing', 'shifts', 'business-hours'],
  //   iconName: 'Clock',
  //   color: 'bg-sky-600',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'routing-language',
  //   name: 'Route by Language',
  //   description: 'Automatically detect contact language and route to the appropriate team.',
  //   category: 'routing',
  //   tags: ['routing', 'language'],
  //   iconName: 'Globe',
  //   color: 'bg-green-600',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },

  // ── Re-engagement ─────────────────────────
  // {
  //   id: 'win-back',
  //   name: 'Win-back Campaign',
  //   description: 'Re-engage inactive contacts with a personalized win-back sequence.',
  //   category: 'reengagement',
  //   tags: ['reengagement', 'campaign'],
  //   iconName: 'RefreshCw',
  //   color: 'bg-amber-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'inactive-reminder',
  //   name: 'Inactive Contact Reminder',
  //   description: "Remind contacts who haven't interacted in a set number of days.",
  //   category: 'reengagement',
  //   tags: ['reengagement', 'reminder'],
  //   iconName: 'Bell',
  //   color: 'bg-lime-600',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'unsubscribe',
  //   name: 'Unsubscribe from Broadcasts',
  //   description: 'Handle unsubscribe requests and mark contacts as opted out.',
  //   category: 'reengagement',
  //   tags: ['unsubscribe', 'compliance'],
  //   iconName: 'BellOff',
  //   color: 'bg-gray-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },

  // ── Notifications & Alerts ────────────────
  // {
  //   id: 'team-notification',
  //   name: 'Team Notification',
  //   description: 'Notify team members when specific events or conditions are met.',
  //   category: 'notifications',
  //   tags: ['notifications', 'team'],
  //   iconName: 'Users',
  //   color: 'bg-sky-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
  // {
  //   id: 'tag-automation',
  //   name: 'Auto-Tagging',
  //   description: 'Automatically tag contacts based on keywords or conversation topics.',
  //   category: 'notifications',
  //   tags: ['tags', 'automation'],
  //   iconName: 'Tag',
  //   color: 'bg-fuchsia-500',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },

  // ── Ads ───────────────────────────────────
  // {
  //   id: 'ctc-appointment',
  //   name: 'CTC: Appointment Scheduling',
  //   description: 'Send a calendar link after a click-to-chat ad interaction.',
  //   category: 'ads',
  //   tags: ['ads', 'appointment'],
  //   iconName: 'CalendarCheck',
  //   color: 'bg-blue-600',
  //   defaultWorkflow: {
  //     trigger: {
  //       type: 'click_to_chat_ads',
  //       conditions: [],
  //       advancedSettings: { triggerOncePerContact: false },
  //       data: { facebookAccountId: '', adSelection: 'all', selectedAdIds: [] },
  //     },
  //     steps: [],
  //   },
  // },
  // {
  //   id: 'broadcast-response-assign',
  //   name: 'Broadcast Response: Assign Agent',
  //   description: 'Assign contacts to agents based on their broadcast response.',
  //   category: 'ads',
  //   tags: ['broadcast', 'assignment'],
  //   iconName: 'Megaphone',
  //   color: 'bg-orange-600',
  //   defaultWorkflow: { trigger: null, steps: [] },
  // },
];

export type TemplateCategoryInfo = {
  id: string;
  label: string;
  icon: string;
  count: number;
};

export const TEMPLATE_CATEGORIES: TemplateCategoryInfo[] = [
  { id: 'all', label: 'All Templates', icon: '🔲', count: TEMPLATES.length },
  { id: 'popular', label: 'Popular', icon: '⭐', count: TEMPLATES.filter((t) => t.popular).length },
  { id: 'welcome', label: 'Welcome & Onboarding', icon: '👋', count: TEMPLATES.filter((t) => t.category === 'welcome').length },
  { id: 'leads', label: 'Lead Generation', icon: '🎯', count: TEMPLATES.filter((t) => t.category === 'leads').length },
  { id: 'support', label: 'Customer Support', icon: '🎧', count: TEMPLATES.filter((t) => t.category === 'support').length },
  { id: 'sales', label: 'Sales & Marketing', icon: '💰', count: TEMPLATES.filter((t) => t.category === 'sales').length },
  { id: 'routing', label: 'Routing', icon: '🔀', count: TEMPLATES.filter((t) => t.category === 'routing').length },
  { id: 'reengagement', label: 'Re-engagement', icon: '🔄', count: TEMPLATES.filter((t) => t.category === 'reengagement').length },
  { id: 'notifications', label: 'Notifications', icon: '🔔', count: TEMPLATES.filter((t) => t.category === 'notifications').length },
  { id: 'ads', label: 'Ads & Tracking', icon: '📢', count: TEMPLATES.filter((t) => t.category === 'ads').length },
];