'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { LoadingSpinner, LoadingOverlay, LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tooltip } from '@/components/ui/Tooltip'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'

export default function TestComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState(false)
  const { showToast } = useToast()

  const tabs = [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: <div className="text-white">Content for Tab 1</div>,
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: <div className="text-white">Content for Tab 2</div>,
    },
    {
      id: 'tab3',
      label: 'Tab 3',
      content: <div className="text-white">Content for Tab 3</div>,
    },
  ]

  const dropdownItems = [
    {
      label: 'Profile',
      onClick: () => showToast({ title: 'Clicked', description: 'Profile clicked', type: 'info' }),
    },
    {
      label: 'Settings',
      onClick: () => showToast({ title: 'Clicked', description: 'Settings clicked', type: 'info' }),
    },
    {
      label: 'Logout',
      variant: 'danger' as const,
      onClick: () => showToast({ title: 'Logout', description: 'Logout clicked', type: 'warning' }),
    },
  ]

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">UI Components Test Page</h1>
          <p className="text-text-secondary">Test all components to ensure they work correctly</p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" isLoading>Loading...</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-white font-bold">Default Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary">This is a default card with header and body.</p>
              </CardBody>
            </Card>

            <Card variant="bordered" hover>
              <CardHeader>
                <h3 className="text-white font-bold">Bordered Hover Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary">Hover over this card to see the effect.</p>
              </CardBody>
            </Card>

            <Card variant="elevated" glow>
              <CardHeader>
                <h3 className="text-white font-bold">Glowing Card</h3>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary">This card has a glow effect.</p>
              </CardBody>
              <CardFooter>
                <Button variant="primary">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="sports">Sports</Badge>
            <Badge variant="politics">Politics</Badge>
            <Badge variant="tech">Tech</Badge>
            <Badge variant="entertainment">Entertainment</Badge>
            <Badge variant="science">Science</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge size="sm">Small</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Avatars</h2>
          <div className="flex items-center gap-4">
            <Avatar username="testuser" size="xs" />
            <Avatar username="testuser" size="sm" />
            <Avatar username="testuser" size="md" />
            <Avatar username="testuser" size="lg" />
            <Avatar username="testuser" size="xl" />
            <Avatar username="alice" />
            <Avatar username="bob" />
            <Avatar username="charlie" />
          </div>
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Modal</h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Test Modal"
            size="md"
          >
            <p className="text-text-secondary mb-4">
              This is a test modal. Press Escape or click outside to close.
            </p>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
            </ModalFooter>
          </Modal>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Tabs</h2>
          <Card>
            <CardBody>
              <Tabs tabs={tabs} />
            </CardBody>
          </Card>
        </section>

        {/* Dropdown Menu */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Dropdown Menu</h2>
          <DropdownMenu
            trigger={<Button variant="secondary">Open Menu ▼</Button>}
            items={dropdownItems}
          />
        </section>

        {/* Loading Components */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Components</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
            <LoadingCard lines={3} />
            <Button onClick={() => {
              setLoadingOverlay(true)
              setTimeout(() => setLoadingOverlay(false), 2000)
            }}>
              Show Loading Overlay (2s)
            </Button>
            {loadingOverlay && <LoadingOverlay message="Loading data..." />}
          </div>
        </section>

        {/* Empty State */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Empty State</h2>
          <Card>
            <CardBody>
              <EmptyState
                icon="📭"
                title="No debates yet"
                description="Create your first debate to get started!"
                action={{
                  label: 'Create Debate',
                  onClick: () => showToast({ title: 'Action clicked', type: 'info' }),
                }}
              />
            </CardBody>
          </Card>
        </section>

        {/* Tooltip */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Tooltip</h2>
          <div className="flex gap-4">
            <Tooltip content="This is a tooltip on top" position="top">
              <Button variant="secondary">Hover me (top)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip on bottom" position="bottom">
              <Button variant="secondary">Hover me (bottom)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip on left" position="left">
              <Button variant="secondary">Hover me (left)</Button>
            </Tooltip>
            <Tooltip content="This is a tooltip on right" position="right">
              <Button variant="secondary">Hover me (right)</Button>
            </Tooltip>
          </div>
        </section>

        {/* Toast Notifications */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Toast Notifications</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => showToast({ title: 'Success!', description: 'Operation completed successfully', type: 'success' })}>
              Show Success Toast
            </Button>
            <Button onClick={() => showToast({ title: 'Error!', description: 'Something went wrong', type: 'error' })}>
              Show Error Toast
            </Button>
            <Button onClick={() => showToast({ title: 'Warning!', description: 'Please be careful', type: 'warning' })}>
              Show Warning Toast
            </Button>
            <Button onClick={() => showToast({ title: 'Info', description: 'Here is some information', type: 'info' })}>
              Show Info Toast
            </Button>
          </div>
        </section>

        {/* Input */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Input</h2>
          <div className="max-w-md space-y-4">
            <Input label="Email" type="email" placeholder="your@email.com" />
            <Input label="Password" type="password" placeholder="••••••••" />
            <Input label="With Error" error="This field is required" />
            <Input label="With Help Text" helpText="This is helpful information" />
          </div>
        </section>
      </div>
    </div>
  )
}

