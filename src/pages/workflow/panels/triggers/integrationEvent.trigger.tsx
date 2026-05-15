import type { Props, TriggerType } from '../../workflow.types';
import { InfoBox, Section } from '../PanelShell';
import { ConditionBuilder } from './conversationClosed';

const COMMERCE_TRIGGER_TYPES = new Set<TriggerType>([
  'commerce.customer_created',
  'commerce.customer_updated',
  'commerce.cart_created',
  'commerce.cart_updated',
  'commerce.cart_abandoned',
  'commerce.order_created',
  'commerce.order_paid',
  'commerce.order_fulfilled',
  'commerce.order_cancelled',
  'commerce.refund_created',
]);

const TRIGGER_COPY: Partial<Record<TriggerType, {
  title: string;
  body: string;
  fields: string[];
}>> = {
  contact_assigned: {
    title: 'Contact Assignment',
    body: 'Runs when a contact is assigned, reassigned, or unassigned. Use conditions to target a specific user or team.',
    fields: ['assigneeId', 'teamId'],
  },
  meta_ad_click: {
    title: 'Meta Ad Click',
    body: 'Runs when a Meta Ads integration sends a normalized ad click or lead event into AxoDesk.',
    fields: ['provider', 'adId', 'adName', 'campaignId', 'campaignName'],
  },
  'commerce.customer_created': {
    title: 'Commerce Customer Created',
    body: 'Runs when Shopify, WooCommerce, BigCommerce, Magento, or another commerce adapter creates a normalized customer.',
    fields: ['provider', 'currency', 'customerEmail', 'customerPhone'],
  },
  'commerce.customer_updated': {
    title: 'Commerce Customer Updated',
    body: 'Runs when a commerce adapter updates customer identity, marketing consent, or spend profile.',
    fields: ['provider', 'currency', 'customerEmail', 'customerPhone'],
  },
  'commerce.cart_created': {
    title: 'Commerce Cart Created',
    body: 'Runs when a commerce adapter creates a normalized cart or checkout.',
    fields: ['provider', 'cartStatus', 'cartTotalAmount', 'cartItemCount', 'checkoutUrl'],
  },
  'commerce.cart_updated': {
    title: 'Commerce Cart Updated',
    body: 'Runs when a commerce adapter updates a normalized cart or checkout.',
    fields: ['provider', 'cartStatus', 'cartTotalAmount', 'cartItemCount', 'checkoutUrl'],
  },
  'commerce.cart_abandoned': {
    title: 'Abandoned Cart',
    body: 'Runs when a normalized commerce cart becomes abandoned. Use it to recover carts across store providers without provider-specific logic.',
    fields: ['provider', 'cartTotalAmount', 'cartItemCount', 'checkoutUrl'],
  },
  'commerce.order_created': {
    title: 'Order Created',
    body: 'Runs when a commerce adapter creates a normalized order.',
    fields: ['provider', 'orderNumber', 'orderTotalAmount', 'financialStatus', 'fulfillmentStatus'],
  },
  'commerce.order_paid': {
    title: 'Order Paid',
    body: 'Runs when a normalized order is paid. Use it for thank-you, upsell, or handoff workflows.',
    fields: ['provider', 'orderNumber', 'orderTotalAmount', 'currency', 'customerEmail'],
  },
  'commerce.order_fulfilled': {
    title: 'Order Fulfilled',
    body: 'Runs when a normalized order is fulfilled. Use it for shipping follow-ups or satisfaction checks.',
    fields: ['provider', 'orderNumber', 'fulfillmentStatus', 'orderPlacedAt'],
  },
  'commerce.order_cancelled': {
    title: 'Order Cancelled',
    body: 'Runs when a normalized commerce order is cancelled.',
    fields: ['provider', 'orderNumber', 'orderStatus', 'financialStatus'],
  },
  'commerce.refund_created': {
    title: 'Refund Created',
    body: 'Runs when a commerce adapter records a normalized refund event.',
    fields: ['provider', 'orderNumber', 'orderTotalAmount', 'currency'],
  },
};

export function IntegrationEventTriggerConfig({ trigger, onChange }: Props) {
  const copy = TRIGGER_COPY[trigger.type] ?? {
    title: 'Integration Event',
    body: 'Runs when a connected integration sends a normalized event into AxoDesk.',
    fields: ['provider', 'integrationId', 'externalEventId'],
  };

  return (
    <>
      <Section title={copy.title}>
        <InfoBox>{copy.body}</InfoBox>
        <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
          Available trigger fields: {copy.fields.join(', ')}
        </div>
        {COMMERCE_TRIGGER_TYPES.has(trigger.type) ? (
          <div className="mt-2 rounded-md border border-gray-100 bg-white px-3 py-2.5 text-xs text-gray-500">
            Message variables include <span className="font-medium text-gray-700">{'{{trigger.orderNumber}}'}</span>,{' '}
            <span className="font-medium text-gray-700">{'{{trigger.totalAmount}}'}</span>, and{' '}
            <span className="font-medium text-gray-700">{'{{trigger.checkoutUrl}}'}</span> when present.
          </div>
        ) : null}
      </Section>

      <ConditionBuilder
        triggerType={trigger.type}
        conditions={trigger.conditions}
        onChange={(conditions) => onChange({ conditions })}
      />
    </>
  );
}
