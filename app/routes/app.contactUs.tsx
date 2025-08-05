// app/routes/contactUs.tsx
import { Page, Card, Text, Layout, BlockStack } from '@shopify/polaris';
import { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

type LoaderData = {
  appName: string;
  contactEmail: string;
  contactNumber: string;
};

// Loader function for future dynamic data
export let loader: LoaderFunction = async () => {
  return {
    appName: 'Notify Rush',
    contactEmail: 'contact@notifyrush.com',
    contactNumber: '+91 9268748628',
  };
};

export default function ContactUs() {
  const { appName, contactEmail, contactNumber } = useLoaderData<LoaderData>();

  return (
    <Page title="Contact Us">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack>
              <Text as='h1' variant="headingMd">Contact {appName} Support</Text>
              <br/>
              <br/>
              <Text as='p'>
                At {appName}, we take customer feedback seriously and stand behind our app. If you have any issues,
                questions, or need help with our app, please don't hesitate to contact us.
              </Text>
              <br/>
              <Text as='h3'>
                Our support team will respond to your inquiries within 24 hours to address your concerns promptly.
              </Text>
              <br/>
              <Text as='h2'>
                <strong>Contact Details:</strong>
              </Text>
              <Text as='p'>Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a></Text>
              <Text as='p'>Phone: {contactNumber}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}