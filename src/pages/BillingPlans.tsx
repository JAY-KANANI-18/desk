import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Zap, Building2, Rocket } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DisclosureButton } from '../components/ui/button/DisclosureButton';
import { Tag } from '../components/ui/Tag';

type BillingCycle = 'monthly' | 'annual';

interface Plan {
  id: string;
  name: string;
  icon: ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  badge?: string;
  cta: string;
  ctaVariant: 'outline' | 'primary' | 'dark';
  current?: boolean;
  features: { label: string; included: boolean; note?: string }[];
}

const getPlanCtaVariant = (variant: Plan['ctaVariant']) => {
  if (variant === 'primary') return 'inverse-primary';
  if (variant === 'dark') return 'dark';
  return 'secondary';
};

const getPlanBadgeColor = (planId: string) =>
  planId === 'enterprise' ? 'tag-purple' : 'primary';

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: <Zap size={22} className="text-blue-500" />,
    monthlyPrice: 29,
    annualPrice: 23,
    description: 'Perfect for small teams getting started with customer support.',
    cta: 'Get Started',
    ctaVariant: 'outline',
    features: [
      { label: '3 team members', included: true },
      { label: '1,000 conversations / mo', included: true },
      { label: '2 channels', included: true },
      { label: 'Basic workflows', included: true },
      { label: 'Email support', included: true },
      { label: 'Advanced analytics', included: false },
      { label: 'AI Assist', included: false },
      { label: 'Custom integrations', included: false },
      { label: 'Priority support', included: false },
      { label: 'SLA management', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: <Rocket size={22} className="text-white" />,
    monthlyPrice: 99,
    annualPrice: 79,
    description: 'For growing teams that need more power and automation.',
    badge: 'Current Plan',
    cta: 'Upgrade Now',
    ctaVariant: 'primary',
    current: true,
    features: [
      { label: '10 team members', included: true },
      { label: 'Unlimited conversations', included: true },
      { label: 'All channels', included: true },
      { label: 'Advanced workflows', included: true },
      { label: 'Priority support', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'AI Assist', included: true },
      { label: 'Custom integrations', included: false },
      { label: 'SLA management', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: <Building2 size={22} className="text-[var(--color-primary)]" />,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Custom solutions for large organisations with complex needs.',
    badge: 'Custom Pricing',
    cta: 'Contact Sales',
    ctaVariant: 'dark',
    features: [
      { label: 'Unlimited team members', included: true },
      { label: 'Unlimited conversations', included: true },
      { label: 'All channels', included: true },
      { label: 'Advanced workflows', included: true },
      { label: 'Priority support', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'AI Assist', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'SLA management', included: true },
      { label: 'Dedicated account manager', included: true },
    ],
  },
];

const FAQ = [
  {
    q: 'Can I change my plan at any time?',
    a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.',
  },
  {
    q: 'What happens when my trial ends?',
    a: "After your trial, you'll be moved to the free tier unless you choose a paid plan. No charges without your consent.",
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a 14-day money-back guarantee on all paid plans. Contact support to request a refund.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes! Annual billing saves you up to 20% compared to monthly billing.',
  },
];

export const BillingPlans = () => {
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            onClick={() => navigate('/billing')}
            variant="ghost"
            size="sm"
            radius="lg"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Billing
          </Button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Choose your plan</h1>
          <p className="text-gray-500 text-base mb-6">
            Start free, scale as you grow. No hidden fees.
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 gap-1">
            <Button
              onClick={() => setCycle('monthly')}
              variant={cycle === 'monthly' ? 'primary' : 'ghost'}
              size="sm"
              radius="full"
            >
              Monthly
            </Button>
            <Button
              onClick={() => setCycle('annual')}
              variant={cycle === 'annual' ? 'primary' : 'ghost'}
              size="sm"
              radius="full"
              preserveChildLayout
            >
              <span className="inline-flex items-center gap-2">
                Annual
                <Tag
                  label="Save 20%"
                  size="sm"
                  bgColor={cycle === 'annual' ? 'primary' : 'success'}
                />
              </span>
            </Button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {PLANS.map((plan) => {
            const isGrowth = plan.id === 'growth';
            const price = cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border flex flex-col overflow-hidden transition-shadow hover:shadow-lg ${
                  isGrowth
                    ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Tag
                      label={plan.badge}
                      size="sm"
                      bgColor={getPlanBadgeColor(plan.id)}
                    />
                  </div>
                )}

                <div className="p-7 flex-1 flex flex-col">
                  {/* Icon + name */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    isGrowth ? 'bg-blue-500' : plan.id === 'enterprise' ? 'bg-[var(--color-primary-light)]' : 'bg-blue-50'
                  }`}>
                    {plan.icon}
                  </div>

                  <h2 className={`text-xl font-bold mb-1 ${isGrowth ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h2>
                  <p className={`text-sm mb-6 ${isGrowth ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.id === 'enterprise' ? (
                      <p className={`text-3xl font-bold ${isGrowth ? 'text-white' : 'text-gray-900'}`}>
                        Custom
                      </p>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${isGrowth ? 'text-white' : 'text-gray-900'}`}>
                          ${price}
                        </span>
                        <span className={`text-sm mb-1.5 ${isGrowth ? 'text-blue-200' : 'text-gray-400'}`}>
                          / mo{cycle === 'annual' ? ', billed annually' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    variant={getPlanCtaVariant(plan.ctaVariant)}
                    size="lg"
                    radius="lg"
                    fullWidth
                    className="mb-7"
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        {f.included ? (
                          <CheckCircle
                            size={16}
                            className={`flex-shrink-0 ${isGrowth ? 'text-blue-200' : 'text-green-500'}`}
                          />
                        ) : (
                          <XCircle size={16} className={`flex-shrink-0 ${isGrowth ? 'text-blue-400' : 'text-gray-300'}`} />
                        )}
                        <span className={
                          f.included
                            ? isGrowth ? 'text-white' : 'text-gray-700'
                            : isGrowth ? 'text-blue-300 line-through' : 'text-gray-400'
                        }>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <DisclosureButton
                  open={openFaq === i}
                  appearance="plain"
                  size="md"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                </DisclosureButton>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pb-4">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </div>
  );
};
