import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Order } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#000000',
    paddingBottom: 5,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    paddingRight: 10,
  },
  value: {
    width: '70%',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#000000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 5,
  },
  priceTable: {
    marginTop: 15,
    width: '50%',
    marginLeft: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 5,
    marginBottom: 5,
  },
  priceLabel: {
    flex: 1,
  },
  priceValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
});

interface ContractPDFProps {
  order: Order;
}

export const ContractPDF: React.FC<ContractPDFProps> = ({ order }) => {
  const amountWithTax = order.amount * (1 + order.tax_rate / 100);
  const taxAmount = order.amount * (order.tax_rate / 100);
  const commissionAmount = order.amount * ((order.commission_rate || 0) / 100);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>契約書</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>契約者情報</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>顧客名:</Text>
            <Text style={styles.value}>{order.customer_name}</Text>
          </View>
          {order.representative_title && (
            <View style={styles.row}>
              <Text style={styles.label}>代表者職名:</Text>
              <Text style={styles.value}>{order.representative_title}</Text>
            </View>
          )}
          {order.representative_name && (
            <View style={styles.row}>
              <Text style={styles.label}>代表者氏名:</Text>
              <Text style={styles.value}>{order.representative_name}</Text>
            </View>
          )}
          {order.customer_postal_code && (
            <View style={styles.row}>
              <Text style={styles.label}>郵便番号:</Text>
              <Text style={styles.value}>{order.customer_postal_code}</Text>
            </View>
          )}
          {order.customer_address && (
            <View style={styles.row}>
              <Text style={styles.label}>住所:</Text>
              <Text style={styles.value}>{order.customer_address}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>担当者メール:</Text>
            <Text style={styles.value}>{order.contact_email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>契約期間</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>契約日:</Text>
            <Text style={styles.value}>{order.contract_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>利用開始日:</Text>
            <Text style={styles.value}>{order.start_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>利用終了日:</Text>
            <Text style={styles.value}>{order.end_date}</Text>
          </View>
          {order.payment_due_date && (
            <View style={styles.row}>
              <Text style={styles.label}>支払期限:</Text>
              <Text style={styles.value}>{order.payment_due_date}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>業務内容</Text>
          </View>
          <Text>{order.service_description}</Text>
        </View>

        {order.special_notes && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text>特約事項</Text>
            </View>
            <Text>{order.special_notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>料金</Text>
          </View>

          <View style={styles.priceTable}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>受注金額（税抜）:</Text>
              <Text style={styles.priceValue}>
                ¥{order.amount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>消費税率 ({order.tax_rate}%):</Text>
              <Text style={styles.priceValue}>
                ¥{taxAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.priceRow, { borderBottom: 2, borderBottomColor: '#000000', marginBottom: 10 }]}>
              <Text style={{ ...styles.priceLabel, fontWeight: 'bold' }}>合計（税込）:</Text>
              <Text style={{ ...styles.priceValue, fontWeight: 'bold', fontSize: 12 }}>
                ¥{amountWithTax.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
              </Text>
            </View>

            {order.commission_rate && (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>代理店手数料率:</Text>
                  <Text style={styles.priceValue}>{order.commission_rate}%</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>代理店手数料:</Text>
                  <Text style={styles.priceValue}>
                    ¥{commissionAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                  </Text>
                </View>
                {order.agency_name && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>代理店名:</Text>
                    <Text style={styles.priceValue}>{order.agency_name}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>本契約書は自動生成されました</Text>
        </View>
      </Page>
    </Document>
  );
};
