package com.tasky.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class TaskWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.task_widget);

        // Intent for Quick Add Button (deep link to quick-task action)
        Intent quickTaskIntent = new Intent(context, MainActivity.class);
        quickTaskIntent.setAction(Intent.ACTION_VIEW);
        quickTaskIntent.setData(Uri.parse("https://localhost?action=quick-task"));
        quickTaskIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        int flag = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flag |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent quickTaskPendingIntent = PendingIntent.getActivity(
                context, 0, quickTaskIntent, flag);
        views.setOnClickPendingIntent(R.id.btn_add_task, quickTaskPendingIntent);

        // Intent for view dashboard (normal launch)
        Intent dashboardIntent = new Intent(context, MainActivity.class);
        dashboardIntent.setAction(Intent.ACTION_MAIN);
        dashboardIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        dashboardIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        PendingIntent dashboardPendingIntent = PendingIntent.getActivity(
                context, 1, dashboardIntent, flag);
        views.setOnClickPendingIntent(R.id.btn_view_dashboard, dashboardPendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
